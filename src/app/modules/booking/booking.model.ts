import mongoose from 'mongoose';
import { IBooking } from './booking.interface';

const bookingSchema = new mongoose.Schema<IBooking>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;
