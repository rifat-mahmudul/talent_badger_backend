import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { badgeService } from './badge.service';

const createBadge = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const fromndata = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await badgeService.createBadge(fromndata, files);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Badge created successfully',
    data: result,
  });
});

const getAllBadges = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm', 'lavel']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await badgeService.getAllBadges(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badges retrieved successfully',
    data: result,
  });
});

const getSingleBadge = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await badgeService.getSingleBadge(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badge retrieved successfully',
    data: result,
  });
});
const updateBadge = catchAsync(async (req, res) => {
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];
  const fromndata = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await badgeService.updateBadge(id, fromndata, files);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badge updated successfully',
    data: result,
  });
});
const deleteBadge = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await badgeService.deleteBadge(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badge deleted successfully',
    data: result,
  });
});

// const lavelUpdateRequest = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const result = await badgeService.requestBadgeLavel(userId);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Badge lavel request successfully',
//     data: result,
//   });
// });

const requestBadgeLavel = catchAsync(async (req, res) => {
  const result = await badgeService.requestBadgeLavel(req.user?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badge lavel request successfully',
    data: result,
  });
});

const alllavelRequest = catchAsync(async (req, res) => {
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
  const result = await badgeService.alllavelRequest(filter, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badge lavel request successfully',
    meta: result.meta,
    data: result.data,
  });
});

const approvedLavel = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { badgeId } = req.body;
  const result = await badgeService.approvedLavel(id, badgeId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badge lavel approved successfully',
    data: result,
  });
});

const getSingleRequestLavel = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await badgeService.getSingleRequestLavel(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Badge lavel approved successfully',
    data: result,
  });
});

export const badgeController = {
  createBadge,
  getAllBadges,
  getSingleBadge,
  updateBadge,
  deleteBadge,
  requestBadgeLavel,
  alllavelRequest,
  approvedLavel,
  getSingleRequestLavel,
};
