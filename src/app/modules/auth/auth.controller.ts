import config from '../../config';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { authService } from './auth.service';

const registerUser = catchAsync(async (req, res) => {
  const result = await authService.registerUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully.',
    data: result,
  });
});

const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    // sameSite: 'strict',
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await authService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token refreshed successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP sent to your email',
    data: result,
  });
});

const verifyEmailOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmailOTP(email, otp);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, newPassword } = req.body;
  const result = await authService.resetPassword(email, newPassword);

  // Set the new refreshToken in cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    // sameSite: 'strict',
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset successfully',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

const logoutUser = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken');
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged out successfully',
  });
});

export const authController = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  verifyEmailOTP,
  resetPassword,
  logoutUser,
};
