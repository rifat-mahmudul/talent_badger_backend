import { Types } from 'mongoose';

export interface IBooking {
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  time: string;
  date: Date;
  link: string;
}
