import config from '../../config';
import AppError from '../../error/appError';
import Project from '../project/project.model';
import User from '../user/user.model';
import Stripe from 'stripe';

const stripe = new Stripe(config.stripe.secretKey!);

const paymentProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (project.client !== user._id)
    throw new AppError(403, 'Only the client can pay for the project');

  if (!project.totalPaid) {
    throw new AppError(400, 'Project payment amount is not set');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: project.title,
          },
          unit_amount: project.totalPaid * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment/cancel`,
  });

  return session.url;
};

export const paymentService = {
  paymentProject,
};
