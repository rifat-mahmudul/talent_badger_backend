import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { assignHoursService } from './assignHours.service';

const createAssignHour = catchAsync(async (req, res) => {
  const managerId = req.user.id;
  const result = await assignHoursService.createAssignHour(managerId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assign Hours created successfully',
    data: result,
  });
});

export const assignHoursController = {
  createAssignHour,
};
