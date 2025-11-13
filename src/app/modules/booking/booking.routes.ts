import express from 'express';
import auth from '../../middlewares/auth';
import userRole from '../user/user.constan';
import { bookingController } from './booking.controller';

const router = express.Router();

router.post(
  '/',
  auth(userRole.User, userRole.Engineer),
  bookingController.createBooking,
);

router.get('/', auth(userRole.Admin), bookingController.getAllBookings);

router.get(
  '/my-bookings',
  auth(userRole.User, userRole.Engineer),
  bookingController.getMyAllBookings,
);

router.get(
  '/:id',
  auth(userRole.User, userRole.Engineer),
  bookingController.getSingleBooking,
);

router.put(
  '/:id',
  auth(userRole.User, userRole.Engineer),
  bookingController.updateBooking,
);

router.delete(
  '/:id',
  auth(userRole.User, userRole.Engineer),
  bookingController.deleteBooking,
);

export const bookingRouter = router;
