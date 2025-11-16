import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import pick from '../../helper/pick';
import { userService } from './user.service';

const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
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
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
  const result = await userService.getAllUser(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const result = await userService.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User fetched successfully',
    data: result,
  });
});

const updateUserById = catchAsync(async (req, res) => {
  const file = req.file;
  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await userService.updateUserById(
    req.params.id,
    fromData,
    file,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const deleteUserById = catchAsync(async (req, res) => {
  const result = await userService.deleteUserById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const result = await userService.getMyProfile(req.user?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User fetched successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
  const filesWithField = Object.keys(filesObj).flatMap((fieldname) =>
    filesObj[fieldname].map((file) => ({ ...file, fieldname }))
  );

  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
<<<<<<< HEAD
  console.log(fromData)
=======

>>>>>>> 06510bab8c727153a9011a52d4b2993d03a71c82
  const result = await userService.updateMyProfile(
    req.user?.id,
    fromData,
    filesWithField,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const createEngineerStripeAccount = catchAsync(async (req, res) => {
  console.log(req.user?.id);
  const result = await userService.createEngineerStripeAccount(req.user?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const getEngineerStripeAccount = catchAsync(async (req, res) => {
  const result = await userService.getEngineerStripeAccount(req.user?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

export const userController = {
  createUser,
  getAllUser,
  getUserById,
  updateUserById,
  deleteUserById,
  getMyProfile,
  updateMyProfile,
  createEngineerStripeAccount,
  getEngineerStripeAccount,
};
