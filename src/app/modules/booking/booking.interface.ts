import { Types } from 'mongoose';

export interface IBooking {
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  link: string;
}
