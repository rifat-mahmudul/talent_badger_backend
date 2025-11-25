// import { Request, Response } from 'express';
// import sendResponse from '../../utils/sendResponse';
// import AppError from '../../error/appError';
// import catchAsync from '../../utils/catchAsycn';
// import { paymentService } from './payment.service';
// import pick from '../../helper/pick';

// const createCheckoutSession = catchAsync(async (req, res) => {
//   const { projectId } = req.body;
//   const clientId = req.user.id;

//   if (!projectId) {
//     throw new AppError(400, 'Project ID is required');
//   }

//   const result = await paymentService.createCheckoutSession(
//     projectId,
//     clientId,
//   );

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Checkout session created successfully',
//     data: result,
//   });
// });

// const handleWebhook = async (req: Request, res: Response) => {
//   try {
//     const sig = req.headers['stripe-signature'] as string;

//     if (!sig) {
//       return res.status(400).json({ error: 'Missing stripe-signature header' });
//     }

//     const result = await paymentService.handleWebhook(req.body, sig);
//     return res.status(200).json(result);
//   } catch (err: any) {
//     console.error('Webhook error:', err.message);
//     return res.status(400).json({ error: err.message });
//   }
// };

// // Get payment status
// const getPaymentStatus = catchAsync(async (req, res) => {
//   const { paymentId } = req.params;

//   if (!paymentId) {
//     throw new AppError(400, 'Payment ID is required');
//   }

//   const payment = await paymentService.getPaymentById(paymentId);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Payment details retrieved',
//     data: payment,
//   });
// });

// // Manual distribution endpoint
// const manualDistribution = catchAsync(async (req, res) => {
//   const { paymentId } = req.params;

//   if (!paymentId) {
//     throw new AppError(400, 'Payment ID is required');
//   }

//   const result = await paymentService.manuallyDistributeFunds(paymentId);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Funds distributed successfully',
//     data: result,
//   });
// });

// const getPaymentHistory = catchAsync(async (req, res) => {
//   const clientId = req.user.id;
//   const filters = pick(req.query, [
//     'searchTerm',
//     'currency',
//     'status',
//     'transferId',
//     'stripePaymentIntentId',
//   ]);
//   const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

//   const result = await paymentService.getPaymentHistory(
//     clientId,
//     filters,
//     options,
//   );

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Payment history retrieved',
//     meta: result.meta,
//     data: result.data,
//   });
// });

// export const paymentController = {
//   createCheckoutSession,
//   handleWebhook,
//   getPaymentStatus,
//   manualDistribution,
//   getPaymentHistory,
// };


// payment.controller.ts
import { Request, Response } from 'express';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../error/appError';
import catchAsync from '../../utils/catchAsycn';
import { paymentService } from './payment.service';
import pick from '../../helper/pick';

const createCheckoutSession = catchAsync(async (req, res) => {
  const { projectId } = req.body;
  const clientId = req.user.id;

  if (!projectId) {
    throw new AppError(400, 'Project ID is required');
  }

  const result = await paymentService.createCheckoutSession(projectId, clientId);

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

  const payment = await paymentService.getPaymentById(paymentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment details retrieved',
    data: payment,
  });
});

// Manual distribution endpoint
const manualDistribution = catchAsync(async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    throw new AppError(400, 'Payment ID is required');
  }

  const result = await paymentService.manuallyDistributeFunds(paymentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Funds distributed successfully',
    data: result,
  });
});

// Fix payment data endpoint
const fixPaymentData = catchAsync(async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    throw new AppError(400, 'Payment ID is required');
  }

  const result = await paymentService.fixPaymentData(paymentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment data fixed successfully',
    data: result,
  });
});

const getPaymentHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const filters = pick(req.query, [
    'searchTerm',
    'currency',
    'status',
    'stripePaymentIntentId',
  ]);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await paymentService.getPaymentHistory(userId, filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment history retrieved',
    meta: result.meta,
    data: result.data,
  });
});

export const paymentController = {
  createCheckoutSession,
  handleWebhook,
  getPaymentStatus,
  manualDistribution,
  getPaymentHistory,
  fixPaymentData,
};