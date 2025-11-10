import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { newsletterService } from './newsletter.service';

const createNewsletter = catchAsync(async (req, res) => {
  const result = await newsletterService.createNewsletter(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Newsletter created successfully',
    data: result,
  });
});

const broadcastNewsletter = catchAsync(async (req, res) => {
  const result = await newsletterService.broadcastNewsletter(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Newsletter broadcasted successfully',
    data: result,
  });
});

export const newsletterController = {
  createNewsletter,
  broadcastNewsletter,
};
