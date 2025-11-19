import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { industrieService } from './industri.service';

const createIndustry = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const file = req.file;
  const result = await industrieService.createIndustry(userId, req.body, file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry created successfully',
    data: result,
  });
});

const getAllIndustrys = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'searchTerm',
    'name',
    'description',
    'status',
  ]);

  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await industrieService.getAllIndustrys(filter, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industries retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const singleIndustry = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await industrieService.singleIndustry(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry retrieved successfully',
    data: result,
  });
});

const updateIndustry = catchAsync(async (req, res) => {
  const { id } = req.params;
  const file = req.file; 
  const fromdata = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await industrieService.updateIndustry(id, fromdata, file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry updated successfully',
    data: result,
  });
});

const deleteIndustry = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await industrieService.deleteIndustry(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry deleted successfully',
    data: result,
  });
});

export const industrieController = {
  createIndustry,
  getAllIndustrys,
  singleIndustry,
  updateIndustry,
  deleteIndustry,
};
