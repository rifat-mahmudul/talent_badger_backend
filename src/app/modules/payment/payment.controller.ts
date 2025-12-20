import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../error/appError';
import { paymentService } from './payment.service';
import pick from '../../helper/pick';

const createCheckoutSession = catchAsync(async (req, res) => {
  const { projectId } = req.body;
  const clientId = req.user.id;

  if (!projectId) throw new AppError(400, 'Project ID required');

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
      return res.status(400).json({ error: 'No stripe signature' });
    }

    const result = await paymentService.handleWebhook(req.body, sig);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Webhook controller error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
};

const getPaymentHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const filters = pick(req.query, []);
  const options = pick(req.query, ['page', 'limit']);

  const result = await paymentService.getPaymentHistory(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment history retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getPaymentById = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  const result = await paymentService.getPaymentById(paymentId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment details retrieved successfully',
    data: result,
  });
});

const manualDistribution = catchAsync(async (req, res) => {
  const { paymentId } = req.params;

  const result = await paymentService.manualDistribution(paymentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Funds distributed successfully',
    data: result,
  });
});

export const paymentController = {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getPaymentById,
  manualDistribution,
};