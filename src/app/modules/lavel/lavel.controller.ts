import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { lavelService } from './lavel.service';

const lavelUpRequest = catchAsync(async (req, res) => {
  const result = await lavelService.lavelUpRequest(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lavel up request successfully',
    data: result,
  });
});

const approvedLavelUp = catchAsync(async (req, res) => {
  const result = await lavelService.approvedLavelUp(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lavel up request approved successfully',
    data: result,
  });
});
const rejectedLavelUp = catchAsync(async (req, res) => {
  const result = await lavelService.rejectedLavelUp(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lavel up request rejected successfully',
    data: result,
  });
});
const alllavelUpRequest = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'searchTerm',
    'firstName',
    'lastName',
    'phone',
    'professionTitle',
    'bio',
    'skills',
    'email',
    'role',
    'status',
    'location',
    'expertise',
    'companyName',
    'location',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await lavelService.alllavelUpRequest(filter, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All lavel up request',
    meta: result.meta,
    data: result.data,
  });
});
export const lavelController = {
  lavelUpRequest,
  approvedLavelUp,
  rejectedLavelUp,
  alllavelUpRequest,
};
