import AppError from '../../error/appError';
import sendMailer from '../../helper/sendMailer';
import { INewsletter } from './newsletter.interface';
import Newsletter from './newsletter.model';

const createNewsletter = async (payload: INewsletter) => {
  const newsletter = await Newsletter.findOne({ email: payload.email });
  if (!newsletter) {
    const result = await Newsletter.create(payload);
    return result;
  }
  return newsletter;
};

const broadcastNewsletter = async (payload: {
  subject?: string;
  html?: string;
}) => {
  const { subject, html } = payload;

  if (!subject?.trim() || !html?.trim()) {
    throw new AppError(400, 'Subject and HTML content are required');
  }

  const subscribers = await Newsletter.find();
  if (!subscribers.length) {
    throw new AppError(404, 'No newsletter subscribers found');
  }

  await Promise.all(
    subscribers.map((sub) =>
      sendMailer(sub.email, subject, html).catch((err) =>
        console.error(`❌ Failed to send email to ${sub.email}:`, err),
      ),
    ),
  );

  return { sentCount: subscribers.length };
};

export const newsletterService = {
  createNewsletter,
  broadcastNewsletter,
};
