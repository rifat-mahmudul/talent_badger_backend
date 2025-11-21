import Stripe from 'stripe';
import config from '../../config';
import Payment from './payment.model';
import Project from '../project/project.model';
import User from '../user/user.model';
import AppError from '../../error/appError';

const stripe = new Stripe(config.stripe.secretKey!, { apiVersion: '2023-08-16' } as any);

// ✅ Create Checkout Session
const createCheckoutSession = async (projectId: string, clientId: string) => {
  const project = await Project.findById(projectId).populate('client').populate('approvedEngineers');

  if (!project) throw new AppError(404, 'Project not found');
  if (!project.client || project.client._id.toString() !== clientId)
    throw new AppError(403, 'Only the client can pay');
  if (!project.totalPaid || project.totalPaid <= 0)
    throw new AppError(400, 'Project totalPaid must be > 0');

  const amountInCents = Math.round(project.totalPaid * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: (project.client as any)?.email,
    line_items: [{ price_data: { currency: 'usd', unit_amount: amountInCents, product_data: { name: `Payment for ${project.title}` } }, quantity: 1 }],
    mode: 'payment',
    success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment-cancel`,
    metadata: { projectId, clientId },
  });

  // Prepare engineers list
  const approvedEngineers = project?.approvedEngineers?.map((eng: any) => ({
    engineer: eng._id,
    hour: eng.hour || 160,
    rate: eng.rate || 0,
    projectFee: 0,
  }));

  const payment = await Payment.create({
    projectId,
    clientId,
    stripeSessionId: session.id,
    amount: amountInCents,
    approvedEngineers,
    status: 'pending',
  });

  return { sessionId: session.id, url: session.url, paymentId: payment._id };
};

// ✅ Distribute Funds
export const distributeFunds = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId).populate('approvedEngineers.engineer');

  if (!payment) throw new AppError(404, 'Payment not found');
  if (payment.status !== 'paid') throw new AppError(400, 'Payment must be paid');

  const totalAmount = payment.amount;
  const adminFee = Math.floor(totalAmount * 0.1);
  const engineerAmount = totalAmount - adminFee;

  const engineers = payment.approvedEngineers;
  if (!engineers || engineers.length === 0) throw new AppError(400, 'No approved engineers');

  // Calculate projectFee and ensure it's never undefined
  engineers.forEach(e => {
    e.projectFee = (e.hour ?? 0) * (e.rate ?? 0) * 100;
  });

  const totalProjectFee = engineers.reduce((sum, e) => sum + (e.projectFee ?? 0), 0);
  if (totalProjectFee <= 0) throw new AppError(400, 'Engineers project fee invalid');

  const transfers: any[] = [];

  for (const e of engineers) {
    const user: any = await User.findById(e.engineer);
    if (!user?.stripeAccountId) continue;

    // Use non-null assertion or ?? 0 to satisfy TS
    const share = Math.floor(((e.projectFee ?? 0) / totalProjectFee) * engineerAmount);

    const transfer = await stripe.transfers.create({
      amount: share,
      currency: 'usd',
      destination: user.stripeAccountId,
    });

    transfers.push({ engineer: user._id, amount: share, transferId: transfer.id });
  }

  payment.adminFee = adminFee;
  payment.engineerFee = engineerAmount;
  payment.transfers = transfers;
  payment.status = 'distributed';
  await payment.save();

  return { totalAmount, adminFee, engineerFee: engineerAmount, transfers };
};


// ✅ Handle Webhook
const handleWebhook = async (rawBody: Buffer, sig: string) => {
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(rawBody, sig, config.stripe.webhookSecret!); }
  catch (err: any) { throw new AppError(400, 'Webhook verification failed: ' + err.message); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await Payment.findOne({ stripeSessionId: session.id });
    if (!payment) return { received: true };
    payment.status = 'paid';
    payment.stripePaymentIntentId = session.payment_intent as string;
    await payment.save();

    // Auto distribute funds
    await distributeFunds(payment._id.toString());
  }

  return { received: true };
};

export const paymentService= {
  createCheckoutSession,
  distributeFunds,
  handleWebhook

}
