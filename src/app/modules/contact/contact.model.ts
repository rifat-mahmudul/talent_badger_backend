import mongoose from 'mongoose';
import { IContact } from './contact.interface';

const contactSchema = new mongoose.Schema<IContact>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true },
);

const Contact = mongoose.model<IContact>('Contact', contactSchema);
export default Contact;
