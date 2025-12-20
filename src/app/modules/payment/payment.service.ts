/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Stripe from 'stripe';
import config from '../../config';
import Payment from './payment.model';
import Project from '../project/project.model';
import User from '../user/user.model';
import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';

const stripe = new Stripe(config.stripe.secretKey!, {
  apiVersion: '2023-08-16',
} as any);

/* ======================================================
   PREPARE ENGINEER PAYMENT DATA
====================================================== */
const prepareEngineerPaymentData = async (project: any) => {
  const approvedEngineers = project.approvedEngineers || [];
  const result = [];
  let totalEngineerCost = 0;
  let totalAllocatedHours = 0;
  let hasValid = false;

  // মোট allocated hours বের করুন
  for (const eng of approvedEngineers) {
    const allocatedHours = eng.allocatedHours || 0;
    totalAllocatedHours += allocatedHours;
  }

  // প্রকল্পে approvedEngineersTotalAmount থাকলে সেটি ব্যবহার করুন
  const totalEngineerBudget = project.approvedEngineersTotalAmount || 0;

  // Admin ফি (approvedEngineersTotalAmount এর 10%)
  const adminFeeFromEngineerBudget = totalEngineerBudget * 0.1;

  // ইঞ্জিনিয়ারদের মোট প্রাপ্য (approvedEngineersTotalAmount এর 90%)
  const engineerPoolFromBudget = totalEngineerBudget * 0.9;

  for (const eng of approvedEngineers) {
    const engineerId = eng.engineer?._id || eng.engineer;
    const engineer = await User.findById(engineerId);

    if (!engineer) continue;

    const allocatedHours = eng.allocatedHours || 0;
    const rate = engineer.rate || 0;
    const projectFee = allocatedHours * rate; // ইঞ্জিনিয়ারের নিজস্ব রেটে হিসাব

    totalEngineerCost += projectFee;

    if (allocatedHours > 0 && rate > 0) hasValid = true;

    result.push({
      engineer: engineerId,
      hour: allocatedHours,
      rate,
      projectFee,
    });
  }

  // স্কেলিং ফ্যাক্টর (engineerPoolFromBudget থেকে ইঞ্জিনিয়ারদের payment)
  let scalingFactor = 1;
  if (totalEngineerCost > 0 && engineerPoolFromBudget > 0) {
    scalingFactor = engineerPoolFromBudget / totalEngineerCost;
  }

  const finalResult = result.map((eng) => ({
    ...eng,
    scaledProjectFee: eng.projectFee * scalingFactor, // বাজেট অনুপাতে স্কেলড ফি
    scalingFactor,
    originalProjectFee: eng.projectFee,
  }));

  return {
    engineers: finalResult,
    hasValid,
    adminFeeFromEngineerBudget, // approvedEngineersTotalAmount এর 10% (Admin পাবে)
    engineerPool: engineerPoolFromBudget, // approvedEngineersTotalAmount এর 90% (ইঞ্জিনিয়াররা পাবে)
    totalEngineerCost,
    scalingFactor,
    totalAllocatedHours,
  };
};

/* ======================================================
   CREATE CHECKOUT SESSION
====================================================== */
const createCheckoutSession = async (projectId: string, clientId: string) => {
  const project = await Project.findById(projectId)
    .populate('client')
    .populate('approvedEngineers.engineer');

  if (!project) throw new AppError(404, 'Project not found');
  if (project.client._id.toString() !== clientId)
    throw new AppError(403, 'Unauthorized');
  if (!project.totalPaid || project.totalPaid <= 0)
    throw new AppError(400, 'Invalid project amount');
  if (!project.approvedEngineers?.length)
    throw new AppError(400, 'No approved engineers');
  if (
    !project.approvedEngineersTotalAmount ||
    project.approvedEngineersTotalAmount <= 0
  )
    throw new AppError(400, 'Invalid approved engineers total amount');

  const {
    engineers,
    hasValid,
    adminFeeFromEngineerBudget, // approvedEngineersTotalAmount এর 10%
    engineerPool, // approvedEngineersTotalAmount এর 90%
    totalEngineerCost,
    scalingFactor,
    totalAllocatedHours,
  } = await prepareEngineerPaymentData(project);

  if (!hasValid) throw new AppError(400, 'Invalid engineer hour or rate');

  const amountInCents = Math.round(project.approvedEngineersTotalAmount * 100);

  // Admin fee (totalPaid এর 10%) - এটা Platform fee
  const platformFeeCents = Math.floor(amountInCents * 0.1);

  // Admin fee (approvedEngineersTotalAmount এর 10%) - এটা extra admin fee
  const adminFeeCents = Math.floor(adminFeeFromEngineerBudget * 100);

  const transferGroup = `project_${projectId}_${Date.now()}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: (project.client as any).email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: {
            name: `Payment for ${project.title}`,
            description: `Total: $${project.approvedEngineersTotalAmount}`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',

    // ONLY transfer_group (no application_fee)
    payment_intent_data: {
      transfer_group: transferGroup,
    },

    success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment-cancel`,

    metadata: {
      projectId,
      clientId,
      platformFee: (project.totalPaid * 0.1).toString(),
      adminFee: adminFeeFromEngineerBudget.toString(),
      engineerPool: engineerPool.toString(),
    },
  });

  const payment = await Payment.create({
    projectId,
    clientId,
    stripeSessionId: session.id,
    amount: project.totalPaid,
    approvedEngineers: engineers,
    platformFee: platformFeeCents / 100, // ✅ totalPaid এর 10% (Platform fee)
    adminFee: adminFeeFromEngineerBudget, // ✅ approvedEngineersTotalAmount এর 10% (Admin পাবে)
    engineerPool, // ✅ approvedEngineersTotalAmount এর 90% (ইঞ্জিনিয়াররা পাবে)
    totalEngineerCost,
    scalingFactor,
    totalAllocatedHours,
    transferGroup,
    status: 'pending',
  });

  return {
    sessionId: session.id,
    url: session.url,
    paymentId: payment._id,
    platformFee: platformFeeCents / 100,
    adminFee: adminFeeFromEngineerBudget,
    engineerPool,
    totalAllocatedHours,
  };
};

/* ======================================================
   DISTRIBUTE FUNDS
====================================================== */
const distributeFunds = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);

  // if (!payment) throw new AppError(404, 'Payment not found');

  if (!payment) throw new AppError(404, 'Payment not found');
  const project = await Project.findById(payment.projectId);
  if (!project) throw new AppError(404, 'Project not found');
  if (payment.status !== 'paid') throw new AppError(400, 'Payment not paid');

  console.log('Starting fund distribution for payment:', paymentId);

  // Platform fee already collected via application_fee (totalPaid এর 10%)
  // Admin fee (approvedEngineersTotalAmount এর 10%) - Admin নিজের অ্যাকাউন্টে transfer করবে

  const adminFeeCents = Math.floor((payment.adminFee || 0) * 100);
  const engineerPoolCents = Math.floor((payment.engineerPool || 0) * 100);

  const engineers = payment.approvedEngineers;
  const transfers: any[] = [];
  let successCount = 0;

  // ✅ Platform fee automatically collected via application_fee, no transfer needed

  // 1. Admin fee transfer (approvedEngineersTotalAmount এর 10%)
  if (adminFeeCents > 0 && config.stripe.platformAccountId) {
    try {
      const transfer = await stripe.transfers.create({
        amount: adminFeeCents,
        currency: 'usd',
        destination: config.stripe.platformAccountId,
        transfer_group: payment.transferGroup,
        description: `Admin fee (10%) for project ${payment.projectId}`,
      });

      console.log('Admin fee transfer created:', transfer.id);

      transfers.push({
        engineer: null,
        amount: adminFeeCents / 100,
        transferId: transfer.id,
        type: 'admin_fee',
        timestamp: new Date(),
        description: '10% of approvedEngineersTotalAmount',
      });
    } catch (error: any) {
      console.error('Admin fee transfer failed:', error.message);
      // Continue even if admin transfer fails
    }
  }

  // 2. Engineer payments (approvedEngineersTotalAmount এর 90% থেকে)
  for (const e of engineers) {
    const user: any = await User.findById(e.engineer);
    if (!user?.stripeAccountId) {
      console.warn(`Engineer ${e.engineer} has no stripe account`);
      continue;
    }

    // ইঞ্জিনিয়ারের স্কেলড ফি (approvedEngineersTotalAmount এর 90% থেকে)
    const share = Math.floor((e.scaledProjectFee || e.projectFee || 0) * 100);

    if (share <= 0) {
      console.warn(`Engineer ${e.engineer} has zero share`);
      continue;
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: share,
        currency: 'usd',
        destination: user.stripeAccountId,
        transfer_group: payment.transferGroup,
        description: `Engineer payment: ${e.hour} hours × $${e.rate}/hour = $${(share / 100).toFixed(2)}`,
      });

      console.log(`Engineer transfer created for ${user._id}:`, transfer.id);

      transfers.push({
        engineer: user._id,
        amount: share / 100,
        transferId: transfer.id,
        type: 'engineer_payment',
        hours: e.hour,
        rate: e.rate,
        originalFee: e.originalProjectFee,
        scaledFee: e.scaledProjectFee,
        scalingFactor: e.scalingFactor,
        timestamp: new Date(),
      });

      successCount++;
    } catch (error: any) {
      console.error(`Engineer transfer failed for ${user._id}:`, error.message);
    }
  }

  // Platform fee already collected via application_fee
  payment.platformFee = payment.platformFee || payment.amount * 0.1;
  payment.adminFee = adminFeeCents / 100;
  payment.engineerPool = engineerPoolCents / 100;
  payment.engineerFee = engineerPoolCents / 100;
  payment.transfers = transfers;

  if (transfers.length > 0) {
    payment.status = 'distributed';

    // project.status = 'completed';
    project.isPaymentDistributed = true;
    await project.save();

    console.log(
      'Payment distributed successfully. Transfers:',
      transfers.length,
    );
  } else {
    payment.status = 'failed';
    console.error('No transfers were successful');
  }

  await payment.save();

  // প্রকল্প স্ট্যাটাস আপডেট
  try {
    await Project.findByIdAndUpdate(payment.projectId, {
      status: 'completed',
      startDate: new Date(),
    });
    console.log('Project status updated to completed');
  } catch (error) {
    console.error('Failed to update project status:', error);
  }

  return payment;
};

/* ======================================================
   WEBHOOK
====================================================== */
const handleWebhook = async (rawBody: Buffer, sig: string) => {
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      config.stripe.webhookSecret!,
    );

    console.log('Webhook event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);

      const payment = await Payment.findOne({
        stripeSessionId: session.id,
      });

      if (!payment) {
        console.error('Payment not found for session:', session.id);
        return { received: true };
      }

      payment.status = 'paid';
      payment.stripePaymentIntentId = session.payment_intent as string;
      await payment.save();

      console.log('Payment marked as paid:', payment._id);

      // Async distribute funds
      distributeFunds(payment._id.toString())
        .then((result) => {
          console.log(
            'Funds distributed successfully for payment:',
            result._id,
          );
        })
        .catch((err) => {
          console.error('Distribution error:', err.message);
        });

      return { received: true };
    }

    return { received: true };
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    throw new AppError(400, `Webhook Error: ${error.message}`);
  }
};

/* ======================================================
   GET PAYMENT HISTORY
====================================================== */
const getPaymentHistory = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip } = pagination(options);
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const where: any = {};
  if (user.role === 'user') where.clientId = user._id;
  if (user.role === 'engineer') where['approvedEngineers.engineer'] = user._id;

  const data = await Payment.find(where)
    .populate('projectId', 'title')
    .populate('clientId', 'firstName lastName email')
    .populate('approvedEngineers.engineer', 'firstName lastName email rate')
    .populate('transfers.engineer', 'firstName lastName email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(where);

  return { data, meta: { total, page, limit } };
};

/* ======================================================
   GET PAYMENT BY ID
====================================================== */
const getPaymentById = async (paymentId: string, userId: string) => {
  const payment = await Payment.findById(paymentId)
    .populate(
      'projectId',
      'title description totalPaid approvedEngineersTotalAmount',
    )
    .populate('clientId', 'firstName lastName email phone')
    .populate(
      'approvedEngineers.engineer',
      'firstName lastName email rate professionTitle',
    )
    .populate('transfers.engineer', 'firstName lastName email');

  if (!payment) throw new AppError(404, 'Payment not found');

  const user = await User.findById(userId);
  if (!user) throw new AppError(401, 'User not found');

  if (user.role === 'user' && payment.clientId.toString() !== userId) {
    throw new AppError(403, 'Unauthorized');
  }

  if (user.role === 'engineer') {
    const isEngineerInPayment = payment.approvedEngineers.some(
      (eng) => eng.engineer.toString() === userId,
    );
    if (!isEngineerInPayment) {
      throw new AppError(403, 'Unauthorized');
    }
  }

  return payment;
};

/* ======================================================
   MANUAL DISTRIBUTION (ADMIN ONLY)
====================================================== */
const manualDistribution = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError(404, 'Payment not found');

  if (payment.status === 'distributed') {
    throw new AppError(400, 'Funds already distributed');
  }

  if (payment.status !== 'paid') {
    throw new AppError(400, 'Payment is not in paid status');
  }

  const result = await distributeFunds(paymentId);
  return result;
};

export const paymentService = {
  createCheckoutSession,
  distributeFunds,
  handleWebhook,
  getPaymentHistory,
  getPaymentById,
  manualDistribution,
};
