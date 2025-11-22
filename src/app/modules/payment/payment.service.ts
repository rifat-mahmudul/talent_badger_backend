import Stripe from 'stripe';
import config from '../../config';
import Payment from './payment.model';
import Project from '../project/project.model';
import User from '../user/user.model';
import AppError from '../../error/appError';
import AssignHour from '../assignHours/assignHours.model';
import pagination, { IOption } from '../../helper/pagenation';
import paymentModel from './payment.model';
import Badge from '../badge/badge.model';

const stripe = new Stripe(config.stripe.secretKey!, {
  apiVersion: '2023-08-16',
} as any);

// ✅ Create Checkout Session
const createCheckoutSession = async (projectId: string, clientId: string) => {
  const project = await Project.findById(projectId)
    .populate('client')
    .populate('approvedEngineers');

  if (!project) throw new AppError(404, 'Project not found');
  if (!project.client || project.client._id.toString() !== clientId)
    throw new AppError(403, 'Only the client can pay');
  if (!project.totalPaid || project.totalPaid <= 0)
    throw new AppError(400, 'Project totalPaid must be > 0');

  const amountInCents = Math.round(project.totalPaid * 100);

  const approvedEngineers = [];

  for (const eng of project.approvedEngineers as any[]) {
    const engineerUser = await User.findById(eng._id);
    const assigned = await AssignHour.findOne({
      projectId,
      engineerId: eng._id,
    });

    const hour = assigned?.hours || 0;
    const rate = engineerUser?.rate || 0;
    const projectFee = Number(hour) * Number(rate) || 0;

    approvedEngineers.push({
      engineer: eng._id,
      hour: hour,
      rate: rate,
      projectFee: projectFee,
    });
  }

  const transferGroup = `project_${projectId}_${Date.now()}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: (project.client as any)?.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: { name: `Payment for ${project.title}` },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_intent_data: {
      transfer_group: transferGroup,
    },
    success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment-cancel`,
    metadata: { projectId, clientId },
  });

  const payment = await Payment.create({
    projectId,
    clientId,
    stripeSessionId: session.id,
    amount: project.totalPaid, // Store in dollars, not cents
    approvedEngineers,
    transferGroup,
    status: 'pending',
  });

  return { sessionId: session.id, url: session.url, paymentId: payment._id };
};

const updateEngineerLevelAndBadge = async (engineerId: string) => {
  const engineer = await User.findById(engineerId);

  if (!engineer) return;

  // ⚡ Increase level based on completed projects
  const completedProjects = engineer.completedProjectsCount || 0;
  const newLevel = Math.floor(completedProjects / 3) + 1; // প্রতি 3 project level increase

  engineer.level = newLevel;

  // ⚡ Find badge for this level
  const badgeData = await Badge.findOne({ lavel: newLevel });

  if (badgeData) {
    engineer.badge = badgeData._id; // save badge reference
  }

  await engineer.save();
};

// ✅ Distribute Funds (Fixed amount calculation)
const distributeFunds = async (paymentId: string) => {
  console.log(`🚀 Starting fund distribution for payment: ${paymentId}`);

  const payment = await Payment.findById(paymentId).populate(
    'approvedEngineers.engineer',
  );

  if (!payment) {
    console.error('❌ Payment not found');
    throw new AppError(404, 'Payment not found');
  }

  if (payment.status !== 'paid') {
    console.error('❌ Payment status is not "paid":', payment.status);
    throw new AppError(400, 'Payment must be paid');
  }

  console.log('💰 Payment details:', {
    amount: payment.amount,
    engineers: payment.approvedEngineers,
  });

  // 🔥 FIX: Convert to cents only for Stripe transfers, store in dollars in database
  const totalAmountInCents = Math.round(payment.amount * 100);
  const adminFeeInCents = Math.floor(totalAmountInCents * 0.1);
  const engineerAmountInCents = totalAmountInCents - adminFeeInCents;

  // Store fees in dollars for database
  const adminFeeInDollars = adminFeeInCents / 100;
  const engineerFeeInDollars = engineerAmountInCents / 100;

  console.log('📊 Fee calculation:', {
    totalAmount: payment.amount,
    totalAmountInCents,
    adminFeeInCents,
    engineerAmountInCents,
    adminFeeInDollars,
    engineerFeeInDollars,
  });

  const engineers = payment.approvedEngineers;
  if (!engineers || engineers.length === 0) {
    console.error('❌ No approved engineers found');
    throw new AppError(400, 'No approved engineers');
  }

  // Calculate total project fee (in dollars)
  let totalProjectFee = 0;
  engineers.forEach((e, index) => {
    console.log(`👨‍💻 Engineer ${index + 1}:`, {
      hour: e.hour,
      rate: e.rate,
      projectFee: e.projectFee,
    });
    totalProjectFee += e.projectFee || 0;
  });

  console.log(`📈 Total Project Fee: ${totalProjectFee}`);

  if (totalProjectFee <= 0) {
    console.error('❌ Total project fee is 0 or negative');
    throw new AppError(400, 'Engineers project fee invalid');
  }

  const transfers: any[] = [];

  // Distribute to engineers (in cents for Stripe)
  for (const [index, e] of engineers.entries()) {
    const user: any = await User.findById(e.engineer);
    console.log(`🔍 Checking engineer ${index + 1}:`, {
      engineerId: e.engineer,
      stripeAccountId: user?.stripeAccountId,
      projectFee: e.projectFee,
    });

    if (!user?.stripeAccountId) {
      console.warn(
        `⚠️ Engineer ${e.engineer} has no Stripe account ID, skipping`,
      );
      continue;
    }

    const shareInCents = Math.floor(
      ((e.projectFee || 0) / totalProjectFee) * engineerAmountInCents,
    );
    const shareInDollars = shareInCents / 100;

    console.log(`💸 Calculating share for engineer ${index + 1}:`, {
      projectFee: e.projectFee,
      totalProjectFee,
      engineerAmountInCents,
      shareInCents,
      shareInDollars,
    });

    try {
      console.log(`🔄 Creating Stripe transfer for engineer ${index + 1}...`);
      const transfer = await stripe.transfers.create({
        amount: shareInCents, // Send cents to Stripe
        currency: 'usd',
        destination: user.stripeAccountId,
        transfer_group: payment.transferGroup,
      });

      console.log(`✅ Transfer successful:`, transfer.id);

      transfers.push({
        engineer: user._id,
        amount: shareInDollars, // Store dollars in database
        transferId: transfer.id,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error(
        `❌ Transfer failed for engineer ${user._id}:`,
        error.message,
      );
      throw new AppError(
        500,
        `Transfer failed for engineer ${user._id}: ${error.message}`,
      );
    }
  }

  // ✅ Add admin fee record - store in dollars
  transfers.push({
    // No engineer field for admin fee
    amount: adminFeeInDollars, // Store dollars in database
    transferId: `platform_fee_${Date.now()}`,
    timestamp: new Date(),
  });

  console.log('🎯 Final transfers:', transfers);

  // Update payment with distribution details (in dollars)
  payment.adminFee = adminFeeInDollars;
  payment.engineerFee = engineerFeeInDollars;
  payment.transfers = transfers;
  payment.status = 'distributed';

  console.log('💾 Saving payment updates...');
  await payment.save();
  console.log('✅ Payment successfully updated and saved');

  for (const e of engineers) {
    await updateEngineerLevelAndBadge(e.engineer);
  }

  console.log('🏆 Engineer level & badges updated successfully');

  return {
    totalAmount: payment.amount,
    adminFee: adminFeeInDollars,
    engineerFee: engineerFeeInDollars,
    transfers,
    totalProjectFee,
  };
};

// ✅ Handle Webhook
const handleWebhook = async (rawBody: Buffer, sig: string) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      config.stripe.webhookSecret!,
    );
  } catch (err: any) {
    console.error('❌ Webhook verification failed:', err.message);
    throw new AppError(400, 'Webhook verification failed: ' + err.message);
  }

  console.log(`📨 Received webhook event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`🛒 Checkout session completed: ${session.id}`);

    const payment = await Payment.findOne({ stripeSessionId: session.id });

    if (!payment) {
      console.error('❌ Payment not found for session:', session.id);
      return { received: true };
    }

    console.log(`📝 Updating payment status to paid: ${payment._id}`);
    payment.status = 'paid';
    payment.stripePaymentIntentId = session.payment_intent as string;
    await payment.save();

    try {
      console.log(`🔄 Starting auto-distribution for payment: ${payment._id}`);
      await distributeFunds(payment._id.toString());
      console.log(
        `✅ Auto-distribution completed successfully for payment: ${payment._id}`,
      );
    } catch (error: any) {
      console.error('❌ Auto-distribution failed:', error.message);
      console.error('Full error:', error);

      // Update payment status to failed
      payment.status = 'failed';
      await payment.save();
    }
  }

  return { received: true };
};

// ✅ Manual distribution function
const manuallyDistributeFunds = async (paymentId: string) => {
  console.log(`🛠️ Manual distribution requested for: ${paymentId}`);

  const payment = await Payment.findById(paymentId);

  if (!payment) throw new AppError(404, 'Payment not found');
  if (payment.status !== 'paid')
    throw new AppError(400, 'Payment must be paid status to distribute');

  try {
    const result = await distributeFunds(paymentId);
    console.log(`✅ Manual distribution successful for: ${paymentId}`);
    return result;
  } catch (error: any) {
    console.error(
      `❌ Manual distribution failed for ${paymentId}:`,
      error.message,
    );

    // Update payment status to failed
    payment.status = 'failed';
    await payment.save();

    throw error;
  }
};

// ✅ Get payment by ID
const getPaymentById = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId)
    .populate('projectId')
    .populate('clientId')
    .populate('approvedEngineers.engineer')
    .populate('transfers.engineer');

  if (!payment) throw new AppError(404, 'Payment not found');

  return payment;
};

const getPaymentHistory = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  // Check user
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const andCondition: any[] = [];

  if (user.role === 'admin') {
    // Admin sees ALL payments → no filter applied
  } else if (user.role === 'user') {
    andCondition.push({
      clientId: user._id,
    });
  } else if (user.role === 'engineer') {
    andCondition.push({
      'approvedEngineers.engineer': user._id,
    });
  }
  const searchableFields = [
    'currency',
    'status',
    'transferId',
    'stripePaymentIntentId',
  ];

  if (searchTerm) {
    andCondition.push({
      $or: searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await paymentModel
    .find(whereCondition)
    .populate('clientId', 'firstName lastName email')
    .populate('projectId', 'title status')
    .populate('approvedEngineers.engineer', 'firstName lastName email')
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await paymentModel.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

export const paymentService = {
  createCheckoutSession,
  distributeFunds,
  handleWebhook,
  manuallyDistributeFunds,
  getPaymentById,
  getPaymentHistory,
};
