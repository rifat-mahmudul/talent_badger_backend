import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import notFoundError from './app/error/notFoundError';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './app/routes/routes';
import { paymentController } from './app/modules/payment/payment.controller';

const app = express();

// Middlewares
app.use(
  cors({
    origin: ['https://talentbadger.com', 'https://admin.talentbadger.com'],
    credentials: true,
  }),
);
app.use(cookieParser());
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application routes (Centralized router)
app.use('/api/v1', router);

// Root router
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the server' });
});

// Not found route
app.use(notFoundError);

// Global error handler
app.use(globalErrorHandler);

export default app;
