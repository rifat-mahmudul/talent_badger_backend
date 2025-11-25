import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { dashboardService } from './dashboard.service';

const dashboardOverView = catchAsync(async (req, res) => {
  const result = await dashboardService.dashboardOverView();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard overview data fetched successfully',
    data: result,
  });
});

const userDashboardOverview = catchAsync(async (req, res) => {
  const result = await dashboardService.userDashboardOverview(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User dashboard overview',
    data: result,
  });
});

const getMonthlyEarnings = catchAsync(async (req, res) => {
  const { year } = req.query;
  const selectedYear = year ? Number(year) : new Date().getFullYear();
  const result = await dashboardService.getMonthlyEarnings(selectedYear);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monthly earnings retrieved successfully',
    data: result,
  });
});

export const dashboardController = {
  dashboardOverView,
  userDashboardOverview,
  getMonthlyEarnings,
};
