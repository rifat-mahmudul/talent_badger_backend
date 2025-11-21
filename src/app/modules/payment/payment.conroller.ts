
import { Request, Response } from 'express';

import sendResponse from '../../utils/sendResponse';
import AppError from '../../error/appError';
import Payment from './payment.model';
import catchAsync from '../../utils/catchAsycn';
import { paymentService } from './payment.service';

const createCheckoutSession = catchAsync(async (req, res) => {
  const { projectId } = req.body;
  const clientId = req.user.id;

  if (!projectId) {
    throw new AppError(400, 'Project ID is required');
  }

  const result = await paymentService.createCheckoutSession(
    projectId,
    clientId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checkout session created successfully',
    data: result,
  });
});

const handleWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const result = await paymentService.handleWebhook(req.body, sig);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: err.message });
  }
};

// Get payment status
const getPaymentStatus = catchAsync(async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    throw new AppError(400, 'Payment ID is required');
  }

  const payment = await Payment.findById(paymentId)
    .populate('projectId', 'title description')
    .populate('clientId', 'email firstName lastName');

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment details retrieved',
    data: payment,
  });
});

export const paymentController = {
  createCheckoutSession,
  handleWebhook,
  getPaymentStatus,
};
