import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { faqService } from './faq.service';

const createFaq = catchAsync(async (req, res) => {
  const result = await faqService.createFaq(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Faq created successfully',
    data: result,
  });
});

const getAllFaq = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm', 'title', 'description']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await faqService.getAllFaq(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Faq retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleFaq = catchAsync(async (req, res) => {
  const result = await faqService.getSingleFaq(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Faq retrieved successfully',
    data: result,
  });
});

const updateFaq = catchAsync(async (req, res) => {
  const result = await faqService.updateFaq(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Faq updated successfully',
    data: result,
  });
});

const deleteFaq = catchAsync(async (req, res) => {
  const result = await faqService.deleteFaq(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Faq deleted successfully',
    data: result,
  });
});

export const faqController = {
  createFaq,
  getAllFaq,
  getSingleFaq,
  updateFaq,
  deleteFaq,
};
