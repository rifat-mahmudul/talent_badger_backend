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

export const dashboardController = {
  dashboardOverView,
  userDashboardOverview,
};
