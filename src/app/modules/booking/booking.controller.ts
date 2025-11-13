import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { bookingService } from './booking.service';

const createBooking = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await bookingService.createBooking(userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getAllBookings = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm', 'link']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await bookingService.getAllBookings(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleBooking = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await bookingService.getSingleBooking(userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking fetched successfully',
    data: result,
  });
});

const updateBooking = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await bookingService.updateBooking(
    userId,
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking updated successfully',
    data: result,
  });
});

const deleteBooking = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await bookingService.deleteBooking(userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});

const getMyAllBookings = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const filters = pick(req.query, ['searchTerm', 'link']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await bookingService.getMyAllBookings(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My bookings retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const bookingController = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  getMyAllBookings,
};
