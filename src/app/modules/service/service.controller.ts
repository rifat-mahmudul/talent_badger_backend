import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { serviceServices } from './service.service';

const createService = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  const user = req.user?.id;
  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await serviceServices.createService(user, fromData, file);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});

const getAllServices = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'searchTerm',
    'serviceName',
    'description',
    'status',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await serviceServices.getAllServices(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Services retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await serviceServices.getSingleService(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const updateService = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  const { id } = req.params;
  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await serviceServices.updateService(id, fromData, file);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});
const deleteService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await serviceServices.deleteService(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service deleted successfully',
    data: result,
  });
});

export const serviceController = {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
};
