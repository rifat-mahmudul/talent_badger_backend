/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../error/appError';
import { IUser } from '../user/user.interface';
import User from '../user/user.model';
import { jwtHelpers } from '../../helper/jwtHelpers';
import sendMailer from '../../helper/sendMailer';

import bcrypt from 'bcryptjs';
import createOtpTemplate from '../../utils/createOtpTemplate';

import userRole from '../user/user.constan';
import Service from '../service/service.model';
import Industry from '../industri/industri.model';

const registerUser = async (payload: Partial<IUser>) => {
  const exist = await User.findOne({ email: payload.email });
  if (exist) throw new AppError(400, 'User already exists');

  const idx = Math.floor(Math.random() * 100);
  payload.profileImage = `https://avatar.iran.liara.run/public/${idx}.png`;

  if (payload.role === userRole.Engineer) {
    const requiredFields = [
      'professionTitle',
      'location',
      'skills',
      'industry',
      'service',
      'bio',
    ];

    for (const field of requiredFields) {
      if (!payload[field as keyof IUser]) {
        throw new AppError(
          400,
          `Missing required field for engineer: ${field}`,
        );
      }
    }
  }

  const result = await User.create(payload);

  if (payload.service) {
    const service = await Service.findById(payload.service);
    if (!service) {
      await User.findByIdAndDelete(result._id);

      throw new AppError(400, 'Service not found');
    }
    service.users.push(result._id);
    await service.save();
  }
  if (payload.industry) {
    const industery = await Industry.findById(payload.industry);
    if (!industery) {
      await User.findByIdAndDelete(result._id);

      throw new AppError(400, 'Industry not found');
    }
    industery.users.push(result._id);
    await industery.save();
  }

  return result;
};

const loginUser = async (payload: Partial<IUser>) => {
  const user = await User.findOne({ email: payload.email });
  if (!user) throw new AppError(401, 'User not found');
  if (!payload.password) throw new AppError(400, 'Password is required');

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );
  if (!isPasswordMatched) throw new AppError(401, 'Password not matched');
  if (user.status !== 'active') throw new AppError(401, 'User is not active');
  const accessToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpires,
  );

  const refreshToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.refreshTokenSecret as Secret,
    config.jwt.refreshTokenExpires,
  );

  user.lastLogin = new Date();
  await user.save();

  const { password, ...userWithoutPassword } = user.toObject();
  return { accessToken, refreshToken, user: userWithoutPassword };
};

const refreshToken = async (token: string) => {
  const varifiedToken = jwtHelpers.verifyToken(
    token,
    config.jwt.refreshTokenSecret as Secret,
  ) as JwtPayload;

  const user = await User.findById(varifiedToken.id);
  if (!user) throw new AppError(401, 'User not found');

  const accessToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpires,
  );

  const { password, ...userWithoutPassword } = user.toObject();
  return { accessToken, user: userWithoutPassword };
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(401, 'User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 20 * 60 * 1000); // 20 mins
  await user.save();

  await sendMailer(
    user.email,
    user.firstName + ' ' + user.lastName,
    createOtpTemplate(otp, user.email, 'Circuitdaddy'),
  );

  return { message: 'OTP sent to your email' };
};

const verifyEmailOTP = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(401, 'User not found');
  console.log(user.otp, otp, user.otpExpiry);
  if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  user.verified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return { message: 'Email verified successfully' };
};

const resetPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, 'User not found');
  if (!user.verified) throw new AppError(400, 'Email not verified');
  if (!newPassword) throw new AppError(400, 'Password is required');

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  // Auto-login after reset
  const accessToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.accessTokenSecret as Secret,
    config.jwt.accessTokenExpires,
  );
  const refreshToken = jwtHelpers.genaretToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.refreshTokenSecret as Secret,
    config.jwt.refreshTokenExpires,
  );

  const { password, ...userWithoutPassword } = user.toObject();
  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

export const authService = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  verifyEmailOTP,
  resetPassword,
};
