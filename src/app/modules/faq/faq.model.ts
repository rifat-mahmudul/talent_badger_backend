import mongoose from 'mongoose';
import { IFaq } from './faq.interface';

const faqSchema = new mongoose.Schema<IFaq>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Faq = mongoose.model<IFaq>('Faq', faqSchema);
export default Faq;
