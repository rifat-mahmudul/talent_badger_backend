// import Stripe from 'stripe';
// import config from '../../config';
// import Payment from './payment.model';
// import Project from '../project/project.model';
// import User from '../user/user.model';
// import AppError from '../../error/appError';
// import AssignHour from '../assignHours/assignHours.model';
// import pagination, { IOption } from '../../helper/pagenation';
// import paymentModel from './payment.model';

// const stripe = new Stripe(config.stripe.secretKey!, {
//   apiVersion: '2023-08-16',
// } as any);

// const updateEngineerCompletedProjects = async (engineerId: string) => {
//   console.log(`📊 Incrementing project count for engineer: ${engineerId}`);

//   try {
//     const result = await User.findByIdAndUpdate(
//       engineerId,
//       {
//         $inc: { completedProjectsCount: 1 }, // ✅ সরাসরি ১ করে বাড়ান
//       },
//       { new: true },
//     );

//     if (!result) {
//       console.warn(`⚠️ Engineer not found: ${engineerId}`);
//       return;
//     }

//     console.log(
//       `✅ Engineer ${engineerId} - Completed Projects: ${result.completedProjectsCount}`,
//     );
//   } catch (error: any) {
//     console.error(`❌ Error updating engineer ${engineerId}:`, error.message);
//   }
// };

// //Create Checkout Session
// const createCheckoutSession = async (projectId: string, clientId: string) => {
//   const project = await Project.findById(projectId)
//     .populate('client')
//     .populate('approvedEngineers');

//   if (!project) throw new AppError(404, 'Project not found');
//   if (!project.client || project.client._id.toString() !== clientId)
//     throw new AppError(403, 'Only the client can pay');
//   if (!project.totalPaid || project.totalPaid <= 0)
//     throw new AppError(400, 'Project totalPaid must be > 0');

//   const amountInCents = Math.round(project.totalPaid * 100);

//   const approvedEngineers = [];

//   for (const eng of project.approvedEngineers as any[]) {
//     const engineerUser = await User.findById(eng._id);
//     const assigned = await AssignHour.findOne({
//       projectId,
//       engineerId: eng._id,
//     });

//     const hour = assigned?.hours || 0;
//     const rate = engineerUser?.rate || 0;
//     const projectFee = Number(hour) * Number(rate) || 0;

//     approvedEngineers.push({
//       engineer: eng._id,
//       hour: hour,
//       rate: rate,
//       projectFee: projectFee,
//     });
//   }

//   const transferGroup = `project_${projectId}_${Date.now()}`;

//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     customer_email: (project.client as any)?.email,
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           unit_amount: amountInCents,
//           product_data: { name: `Payment for ${project.title}` },
//         },
//         quantity: 1,
//       },
//     ],
//     mode: 'payment',
//     payment_intent_data: {
//       transfer_group: transferGroup,
//     },
//     success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.frontendUrl}/payment-cancel`,
//     metadata: { projectId, clientId },
//   });

//   const payment = await Payment.create({
//     projectId,
//     clientId,
//     stripeSessionId: session.id,
//     amount: project.totalPaid, // Store in dollars, not cents
//     approvedEngineers,
//     transferGroup,
//     status: 'pending',
//   });

//   return { sessionId: session.id, url: session.url, paymentId: payment._id };
// };

// // ✅ Distribute Funds (Fixed amount calculation)
// const distributeFunds = async (paymentId: string) => {
//   console.log(`🚀 Starting fund distribution for payment: ${paymentId}`);

//   const payment = await Payment.findById(paymentId).populate(
//     'approvedEngineers.engineer',
//   );

//   if (!payment) {
//     console.error('❌ Payment not found');
//     throw new AppError(404, 'Payment not found');
//   }

//   if (payment.status !== 'paid') {
//     console.error('❌ Payment status is not "paid":', payment.status);
//     throw new AppError(400, 'Payment must be paid');
//   }

//   console.log('💰 Payment details:', {
//     amount: payment.amount,
//     engineers: payment.approvedEngineers,
//   });

//   // 🔥 FIX: Convert to cents only for Stripe transfers, store in dollars in database
//   const totalAmountInCents = Math.round(payment.amount * 100);
//   const adminFeeInCents = Math.floor(totalAmountInCents * 0.1);
//   const engineerAmountInCents = totalAmountInCents - adminFeeInCents;

//   // Store fees in dollars for database
//   const adminFeeInDollars = adminFeeInCents / 100;
//   const engineerFeeInDollars = engineerAmountInCents / 100;

//   console.log('📊 Fee calculation:', {
//     totalAmount: payment.amount,
//     totalAmountInCents,
//     adminFeeInCents,
//     engineerAmountInCents,
//     adminFeeInDollars,
//     engineerFeeInDollars,
//   });

//   const engineers = payment.approvedEngineers;
//   if (!engineers || engineers.length === 0) {
//     console.error('❌ No approved engineers found');
//     throw new AppError(400, 'No approved engineers');
//   }

//   // Calculate total project fee (in dollars)
//   let totalProjectFee = 0;
//   engineers.forEach((e, index) => {
//     console.log(`👨‍💻 Engineer ${index + 1}:`, {
//       hour: e.hour,
//       rate: e.rate,
//       projectFee: e.projectFee,
//     });
//     totalProjectFee += e.projectFee || 0;
//   });

//   console.log(`📈 Total Project Fee: ${totalProjectFee}`);

//   if (totalProjectFee <= 0) {
//     console.error('❌ Total project fee is 0 or negative');
//     throw new AppError(400, 'Engineers project fee invalid');
//   }

//   const transfers: any[] = [];

//   // Distribute to engineers (in cents for Stripe)
//   for (const [index, e] of engineers.entries()) {
//     const user: any = await User.findById(e.engineer);
//     console.log(`🔍 Checking engineer ${index + 1}:`, {
//       engineerId: e.engineer,
//       stripeAccountId: user?.stripeAccountId,
//       projectFee: e.projectFee,
//     });

//     if (!user?.stripeAccountId) {
//       console.warn(
//         `⚠️ Engineer ${e.engineer} has no Stripe account ID, skipping`,
//       );
//       continue;
//     }

//     const shareInCents = Math.floor(
//       ((e.projectFee || 0) / totalProjectFee) * engineerAmountInCents,
//     );
//     const shareInDollars = shareInCents / 100;

//     console.log(`💸 Calculating share for engineer ${index + 1}:`, {
//       projectFee: e.projectFee,
//       totalProjectFee,
//       engineerAmountInCents,
//       shareInCents,
//       shareInDollars,
//     });

//     try {
//       console.log(`🔄 Creating Stripe transfer for engineer ${index + 1}...`);
//       const transfer = await stripe.transfers.create({
//         amount: shareInCents, // Send cents to Stripe
//         currency: 'usd',
//         destination: user.stripeAccountId,
//         transfer_group: payment.transferGroup,
//       });

//       console.log(`✅ Transfer successful:`, transfer.id);

//       transfers.push({
//         engineer: user._id,
//         amount: shareInDollars, // Store dollars in database
//         transferId: transfer.id,
//         timestamp: new Date(),
//       });
//     } catch (error: any) {
//       console.error(
//         `❌ Transfer failed for engineer ${user._id}:`,
//         error.message,
//       );
//       throw new AppError(
//         500,
//         `Transfer failed for engineer ${user._id}: ${error.message}`,
//       );
//     }
//   }

//   // ✅ Add admin fee record - store in dollars
//   transfers.push({
//     // No engineer field for admin fee
//     amount: adminFeeInDollars, // Store dollars in database
//     transferId: `platform_fee_${Date.now()}`,
//     timestamp: new Date(),
//   });

//   console.log('🎯 Final transfers:', transfers);

//   // Update payment with distribution details (in dollars)
//   payment.adminFee = adminFeeInDollars;
//   payment.engineerFee = engineerFeeInDollars;
//   payment.transfers = transfers;
//   payment.status = 'distributed';

//   console.log('💾 Saving payment updates...');
//   await payment.save();
//   console.log('✅ Payment successfully updated and saved');

//   // ✅ ইঞ্জিনিয়ারদের লেভেল এবং ব্যাজ আপডেট করুন
//   console.log('🏆 Starting engineer level and badge updates...');
//   for (const e of engineers) {
//     try {
//       await updateEngineerCompletedProjects(e.engineer as any);
//       console.log(`✅ Updated level/badge for engineer: ${e.engineer}`);
//     } catch (error: any) {
//       console.error(
//         `❌ Failed to update engineer ${e.engineer}:`,
//         error.message,
//       );
//       // Continue with other engineers even if one fails
//     }
//   }

//   console.log('🏆 Engineer level & badges update process completed');

//   console.log('🏆 Engineer level & badges updated successfully');

//   return {
//     totalAmount: payment.amount,
//     adminFee: adminFeeInDollars,
//     engineerFee: engineerFeeInDollars,
//     transfers,
//     totalProjectFee,
//   };
// };

// // ✅ Handle Webhook
// const handleWebhook = async (rawBody: Buffer, sig: string) => {
//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       rawBody,
//       sig,
//       config.stripe.webhookSecret!,
//     );
//   } catch (err: any) {
//     console.error('❌ Webhook verification failed:', err.message);
//     throw new AppError(400, 'Webhook verification failed: ' + err.message);
//   }

//   console.log(`📨 Received webhook event: ${event.type}`);

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as Stripe.Checkout.Session;
//     console.log(`🛒 Checkout session completed: ${session.id}`);

//     const payment = await Payment.findOne({ stripeSessionId: session.id });

//     if (!payment) {
//       console.error('❌ Payment not found for session:', session.id);
//       return { received: true };
//     }

//     console.log(`📝 Updating payment status to paid: ${payment._id}`);
//     payment.status = 'paid';
//     payment.stripePaymentIntentId = session.payment_intent as string;
//     await payment.save();

//     try {
//       console.log(`🔄 Starting auto-distribution for payment: ${payment._id}`);
//       await distributeFunds(payment._id.toString());
//       console.log(
//         `✅ Auto-distribution completed successfully for payment: ${payment._id}`,
//       );
//     } catch (error: any) {
//       console.error('❌ Auto-distribution failed:', error.message);
//       console.error('Full error:', error);

//       // Update payment status to failed
//       payment.status = 'failed';
//       await payment.save();
//     }
//   }

//   return { received: true };
// };

// // ✅ Manual distribution function
// const manuallyDistributeFunds = async (paymentId: string) => {
//   console.log(`🛠️ Manual distribution requested for: ${paymentId}`);

//   const payment = await Payment.findById(paymentId);

//   if (!payment) throw new AppError(404, 'Payment not found');
//   if (payment.status !== 'paid')
//     throw new AppError(400, 'Payment must be paid status to distribute');

//   try {
//     const result = await distributeFunds(paymentId);
//     console.log(`✅ Manual distribution successful for: ${paymentId}`);
//     return result;
//   } catch (error: any) {
//     console.error(
//       `❌ Manual distribution failed for ${paymentId}:`,
//       error.message,
//     );

//     // Update payment status to failed
//     payment.status = 'failed';
//     await payment.save();

//     throw error;
//   }
// };

// // ✅ Get payment by ID
// const getPaymentById = async (paymentId: string) => {
//   const payment = await Payment.findById(paymentId)
//     .populate('projectId')
//     .populate('clientId')
//     .populate('approvedEngineers.engineer')
//     .populate('transfers.engineer');

//   if (!payment) throw new AppError(404, 'Payment not found');

//   return payment;
// };

// const getPaymentHistory = async (
//   userId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);
//   const { searchTerm, ...filterData } = params;

//   // Check user
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(404, 'User not found');

//   const andCondition: any[] = [];

//   if (user.role === 'admin') {
//     // Admin sees ALL payments → no filter applied
//   } else if (user.role === 'user') {
//     andCondition.push({
//       clientId: user._id,
//     });
//   } else if (user.role === 'engineer') {
//     andCondition.push({
//       'approvedEngineers.engineer': user._id,
//     });
//   }
//   const searchableFields = [
//     'currency',
//     'status',
//     'transferId',
//     'stripePaymentIntentId',
//   ];

//   if (searchTerm) {
//     andCondition.push({
//       $or: searchableFields.map((field) => ({
//         [field]: { $regex: searchTerm, $options: 'i' },
//       })),
//     });
//   }

//   if (Object.keys(filterData).length) {
//     andCondition.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

//   const result = await paymentModel
//     .find(whereCondition)
//     .populate('clientId', 'firstName lastName email')
//     .populate('projectId', 'title status')
//     .populate('approvedEngineers.engineer', 'firstName lastName email')
//     .skip(skip)
//     .limit(limit)
//     .sort({ [sortBy]: sortOrder } as any);

//   const total = await paymentModel.countDocuments(whereCondition);

//   return {
//     data: result,
//     meta: {
//       total,
//       page,
//       limit,
//     },
//   };
// };

// export const paymentService = {
//   createCheckoutSession,
//   distributeFunds,
//   handleWebhook,
//   manuallyDistributeFunds,
//   getPaymentById,
//   getPaymentHistory,
// };

// ============================code is working fin====================================

// // payment.service.ts
// import Stripe from 'stripe';
// import config from '../../config';
// import Payment from './payment.model';
// import Project from '../project/project.model';
// import User from '../user/user.model';
// import AppError from '../../error/appError';
// import AssignHour from '../assignHours/assignHours.model';
// import pagination, { IOption } from '../../helper/pagenation';

// const stripe = new Stripe(config.stripe.secretKey!, {
//   apiVersion: '2023-08-16',
// } as any);

// // Utility function to update engineer completed projects
// const updateEngineerCompletedProjects = async (engineerId: string) => {
//   console.log(`📊 Incrementing project count for engineer: ${engineerId}`);

//   try {
//     const result = await User.findByIdAndUpdate(
//       engineerId,
//       {
//         $inc: { completedProjectsCount: 1 },
//       },
//       { new: true },
//     );

//     if (!result) {
//       console.warn(`⚠️ Engineer not found: ${engineerId}`);
//       return;
//     }

//     console.log(
//       `✅ Engineer ${engineerId} - Completed Projects: ${result.completedProjectsCount}`,
//     );
//   } catch (error: any) {
//     console.error(`❌ Error updating engineer ${engineerId}:`, error.message);
//   }
// };

// // Validate and prepare engineer data
// const validateAndPrepareEngineerData = async (
//   projectId: string,
//   approvedEngineers: any[],
// ) => {
//   const validatedEngineers = [];
//   let hasValidEngineers = false;

//   for (const approvedEng of approvedEngineers) {
//     const engineerId = approvedEng.engineer?._id || approvedEng.engineer;

//     if (!engineerId) {
//       console.warn('⚠️ Skipping engineer with no ID');
//       continue;
//     }

//     const engineer = await User.findById(engineerId);
//     if (!engineer) {
//       console.warn(`⚠️ Engineer ${engineerId} not found, skipping`);
//       continue;
//     }

//     // Get assigned hours for this engineer
//     const assignedHours = await AssignHour.findOne({
//       projectId,
//       engineerId: engineerId,
//     });

//     const hour = assignedHours?.hours || 0;
//     const rate = engineer.rate || 0;
//     const projectFee = hour * rate;

//     // Validate engineer has Stripe account
//     if (!engineer.stripeAccountId) {
//       console.warn(
//         `⚠️ Engineer ${engineer.firstName} has no Stripe account, will skip distribution`,
//       );
//     }

//     // Check if this is a valid engineer (has hours and rate)
//     if (hour > 0 && rate > 0) {
//       hasValidEngineers = true;
//     }

//     validatedEngineers.push({
//       engineer: engineerId,
//       hour,
//       rate,
//       projectFee,
//     });

//     console.log(`👨‍💻 Engineer ${engineer.firstName}:`, {
//       hour,
//       rate,
//       projectFee,
//       hasStripe: !!engineer.stripeAccountId,
//     });
//   }

//   return { validatedEngineers, hasValidEngineers };
// };

// // Create Checkout Session
// const createCheckoutSession = async (projectId: string, clientId: string) => {
//   // Validate inputs
//   if (!projectId) {
//     throw new AppError(400, 'Project ID is required');
//   }

//   const project = await Project.findById(projectId)
//     .populate('client')
//     .populate({
//       path: 'approvedEngineers.engineer',
//       model: 'User',
//     });

//   if (!project) {
//     throw new AppError(404, 'Project not found');
//   }

//   if (!project.client || project.client._id.toString() !== clientId) {
//     throw new AppError(403, 'Only the client can pay for this project');
//   }

//   if (!project.totalPaid || project.totalPaid <= 0) {
//     throw new AppError(400, 'Project totalPaid must be greater than 0');
//   }

//   // Validate project has approved engineers
//   if (!project.approvedEngineers || project.approvedEngineers.length === 0) {
//     throw new AppError(400, 'Project has no approved engineers');
//   }

//   // Prepare and validate engineer data
//   const { validatedEngineers, hasValidEngineers } =
//     await validateAndPrepareEngineerData(projectId, project.approvedEngineers);

//   if (!hasValidEngineers) {
//     throw new AppError(400, 'No engineers with valid hours and rates found');
//   }

//   const amountInCents = Math.round(project.totalPaid * 100);
//   const transferGroup = `project_${projectId}_${Date.now()}`;

//   // Create Stripe checkout session
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     customer_email: (project.client as any)?.email,
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           unit_amount: amountInCents,
//           product_data: {
//             name: `Payment for ${project.title}`,
//             description: `Project involving ${validatedEngineers.length} engineer(s)`,
//           },
//         },
//         quantity: 1,
//       },
//     ],
//     mode: 'payment',
//     payment_intent_data: {
//       transfer_group: transferGroup,
//     },
//     success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.frontendUrl}/payment-cancel`,
//     metadata: { projectId, clientId },
//   });

//   // Create payment record
//   const payment = await Payment.create({
//     projectId,
//     clientId,
//     stripeSessionId: session.id,
//     amount: project.totalPaid,
//     approvedEngineers: validatedEngineers,
//     transferGroup,
//     status: 'pending',
//   });

//   return {
//     sessionId: session.id,
//     url: session.url,
//     paymentId: payment._id,
//     engineersCount: validatedEngineers.length,
//   };
// };

// // Distribute Funds
// const distributeFunds = async (paymentId: string) => {
//   console.log(`🚀 Starting fund distribution for payment: ${paymentId}`);

//   const payment = await Payment.findById(paymentId).populate(
//     'approvedEngineers.engineer',
//   );
//   if (!payment) {
//     throw new AppError(404, 'Payment not found');
//   }

//   // Validate payment status
//   if (payment.status !== 'paid') {
//     throw new AppError(
//       400,
//       `Payment must be 'paid' status. Current status: ${payment.status}`,
//     );
//   }

//   // Validate approved engineers data
//   if (!payment.approvedEngineers || payment.approvedEngineers.length === 0) {
//     throw new AppError(400, 'No approved engineers found in payment');
//   }

//   console.log('💰 Payment details:', {
//     amount: payment.amount,
//     engineersCount: payment.approvedEngineers.length,
//     engineers: payment.approvedEngineers.map((eng) => ({
//       engineer: eng.engineer,
//       hour: eng.hour,
//       rate: eng.rate,
//       projectFee: eng.projectFee,
//     })),
//   });

//   // Calculate total project fee and validate
//   const totalProjectFee = payment.approvedEngineers.reduce(
//     (sum, eng) => sum + (eng.projectFee || 0),
//     0,
//   );

//   console.log(`📈 Total Project Fee: ${totalProjectFee}`);

//   if (totalProjectFee <= 0) {
//     throw new AppError(400, 'Total project fee must be greater than 0');
//   }

//   // Convert to cents for Stripe
//   const totalAmountInCents = Math.round(payment.amount * 100);
//   const adminFeeInCents = Math.floor(totalAmountInCents * 0.1); // 10% admin fee
//   const engineerAmountInCents = totalAmountInCents - adminFeeInCents;

//   // Store in dollars for database
//   const adminFeeInDollars = adminFeeInCents / 100;
//   const engineerFeeInDollars = engineerAmountInCents / 100;

//   console.log('📊 Fee calculation:', {
//     totalAmount: payment.amount,
//     totalAmountInCents,
//     adminFeeInCents,
//     engineerAmountInCents,
//     adminFeeInDollars,
//     engineerFeeInDollars,
//   });

//   const transfers: any[] = [];
//   let successfulTransfers = 0;

//   // Distribute to engineers
//   for (const [index, eng] of payment.approvedEngineers.entries()) {
//     const engineer = await User.findById(eng.engineer);

//     if (!engineer) {
//       console.warn(`⚠️ Engineer ${eng.engineer} not found, skipping`);
//       continue;
//     }

//     if (!engineer.stripeAccountId) {
//       console.warn(
//         `⚠️ Engineer ${engineer.firstName} has no Stripe account, skipping`,
//       );
//       continue;
//     }

//     // Calculate share based on project fee proportion
//     const shareInCents = Math.floor(
//       ((eng.projectFee || 0) / totalProjectFee) * engineerAmountInCents,
//     );

//     if (shareInCents <= 0) {
//       console.warn(
//         `⚠️ Share is 0 for engineer ${engineer.firstName}, skipping`,
//       );
//       continue;
//     }

//     const shareInDollars = shareInCents / 100;

//     console.log(`💸 Engineer ${engineer.firstName}:`, {
//       projectFee: eng.projectFee,
//       sharePercentage:
//         (((eng.projectFee || 0) / totalProjectFee) * 100).toFixed(2) + '%',
//       shareInCents,
//       shareInDollars,
//     });

//     try {
//       console.log(`🔄 Creating Stripe transfer for ${engineer.firstName}...`);

//       const transfer = await stripe.transfers.create({
//         amount: shareInCents,
//         currency: 'usd',
//         destination: engineer.stripeAccountId,
//         transfer_group: payment.transferGroup,
//         description: `Payment for project ${payment.projectId} - ${engineer.firstName}`,
//       });

//       console.log(`✅ Transfer successful:`, transfer.id);
//       successfulTransfers++;

//       transfers.push({
//         engineer: engineer._id,
//         amount: shareInDollars,
//         transferId: transfer.id,
//         timestamp: new Date(),
//       });
//     } catch (error: any) {
//       console.error(
//         `❌ Transfer failed for ${engineer.firstName}:`,
//         error.message,
//       );
//       // Don't throw here, continue with other engineers
//       console.log(
//         `⚠️ Continuing with other engineers despite failure for ${engineer.firstName}`,
//       );
//     }
//   }

//   // Add admin fee record
//   if (adminFeeInDollars > 0) {
//     transfers.push({
//       amount: adminFeeInDollars,
//       transferId: `admin_fee_${Date.now()}`,
//       timestamp: new Date(),
//     });
//   }

//   console.log('🎯 Transfer summary:', {
//     totalEngineers: payment.approvedEngineers.length,
//     successfulTransfers,
//     failedTransfers: payment.approvedEngineers.length - successfulTransfers,
//     totalTransfers: transfers.length,
//   });

//   // Update payment
//   payment.adminFee = adminFeeInDollars;
//   payment.engineerFee = engineerFeeInDollars;
//   payment.transfers = transfers;
//   payment.status = successfulTransfers > 0 ? 'distributed' : 'failed';

//   await payment.save();
//   console.log(`✅ Payment status updated to: ${payment.status}`);

//   // Update engineer completed projects count for successful transfers
//   if (successfulTransfers > 0) {
//     console.log('🏆 Updating engineer completed projects...');
//     for (const eng of payment.approvedEngineers) {
//       try {
//         await updateEngineerCompletedProjects(eng.engineer.toString());
//         console.log(`✅ Updated project count for engineer: ${eng.engineer}`);
//       } catch (error: any) {
//         console.error(
//           `⚠️ Failed to update engineer ${eng.engineer}:`,
//           error.message,
//         );
//       }
//     }
//   }

//   return {
//     totalAmount: payment.amount,
//     adminFee: adminFeeInDollars,
//     engineerFee: engineerFeeInDollars,
//     successfulTransfers,
//     totalTransfers: transfers.length,
//     status: payment.status,
//     totalProjectFee,
//   };
// };

// // Handle Webhook
// const handleWebhook = async (rawBody: Buffer, sig: string) => {
//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       rawBody,
//       sig,
//       config.stripe.webhookSecret!,
//     );
//   } catch (err: any) {
//     console.error('❌ Webhook verification failed:', err.message);
//     throw new AppError(400, 'Webhook verification failed: ' + err.message);
//   }

//   console.log(`📨 Received webhook event: ${event.type}`);

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as Stripe.Checkout.Session;
//     console.log(`🛒 Checkout session completed: ${session.id}`);

//     const payment = await Payment.findOne({ stripeSessionId: session.id });

//     if (!payment) {
//       console.error('❌ Payment not found for session:', session.id);
//       return { received: true };
//     }

//     console.log(`📝 Updating payment status to paid: ${payment._id}`);
//     payment.status = 'paid';
//     payment.stripePaymentIntentId = session.payment_intent as string;
//     await payment.save();

//     try {
//       console.log(`🔄 Starting auto-distribution for payment: ${payment._id}`);
//       const result = await distributeFunds(payment._id.toString());
//       console.log(`✅ Auto-distribution completed:`, result);
//     } catch (error: any) {
//       console.error('❌ Auto-distribution failed:', error.message);

//       // Update payment status to failed
//       payment.status = 'failed';
//       await payment.save();

//       console.error('Full error:', error);
//     }
//   }

//   return { received: true };
// };

// // Manual distribution function
// const manuallyDistributeFunds = async (paymentId: string) => {
//   console.log(`🛠️ Manual distribution requested for: ${paymentId}`);

//   const payment = await Payment.findById(paymentId);

//   if (!payment) throw new AppError(404, 'Payment not found');

//   if (payment.status === 'distributed') {
//     throw new AppError(400, 'Payment has already been distributed');
//   }

//   if (payment.status !== 'paid') {
//     throw new AppError(400, 'Payment must be paid status to distribute');
//   }

//   try {
//     const result = await distributeFunds(paymentId);
//     console.log(`✅ Manual distribution successful for: ${paymentId}`);
//     return result;
//   } catch (error: any) {
//     console.error(
//       `❌ Manual distribution failed for ${paymentId}:`,
//       error.message,
//     );

//     // Update payment status to failed
//     payment.status = 'failed';
//     await payment.save();

//     throw error;
//   }
// };

// // Get payment by ID
// const getPaymentById = async (paymentId: string) => {
//   const payment = await Payment.findById(paymentId)
//     .populate('projectId')
//     .populate('clientId')
//     .populate('approvedEngineers.engineer')
//     .populate('transfers.engineer');

//   if (!payment) throw new AppError(404, 'Payment not found');

//   return payment;
// };

// // Get payment history
// const getPaymentHistory = async (
//   userId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);
//   const { searchTerm, ...filterData } = params;

//   // Check user
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(404, 'User not found');

//   const andCondition: any[] = [];

//   // Role-based filtering
//   if (user.role === 'user') {
//     andCondition.push({ clientId: user._id });
//   } else if (user.role === 'engineer') {
//     andCondition.push({ 'approvedEngineers.engineer': user._id });
//   }
//   // Admin sees all payments - no filter needed

//   const searchableFields = ['currency', 'status', 'stripePaymentIntentId'];

//   if (searchTerm) {
//     andCondition.push({
//       $or: searchableFields.map((field) => ({
//         [field]: { $regex: searchTerm, $options: 'i' },
//       })),
//     });
//   }

//   if (Object.keys(filterData).length) {
//     andCondition.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

//   const result = await Payment.find(whereCondition)
//     .populate('clientId', 'firstName lastName email')
//     .populate('projectId', 'title status')
//     .populate('approvedEngineers.engineer', 'firstName lastName email rate')
//     .populate('transfers.engineer', 'firstName lastName')
//     .skip(skip)
//     .limit(limit)
//     .sort({ [sortBy]: sortOrder } as any);

//   const total = await Payment.countDocuments(whereCondition);

//   return {
//     data: result,
//     meta: {
//       total,
//       page,
//       limit,
//     },
//   };
// };

// // Fix payment data utility
// const fixPaymentData = async (paymentId: string) => {
//   const payment = await Payment.findById(paymentId);
//   if (!payment) {
//     throw new AppError(404, 'Payment not found');
//   }

//   const project = await Project.findById(payment.projectId);
//   if (!project) {
//     throw new AppError(404, 'Project not found');
//   }

//   const { validatedEngineers } = await validateAndPrepareEngineerData(
//     payment.projectId.toString(),
//     (project as any).approvedEngineers,
//   );

//   payment.approvedEngineers = validatedEngineers;
//   await payment.save();

//   return {
//     message: 'Payment data fixed successfully',
//     paymentId: payment._id,
//     engineersCount: validatedEngineers.length,
//     engineers: validatedEngineers,
//   };
// };

// export const paymentService = {
//   createCheckoutSession,
//   distributeFunds,
//   handleWebhook,
//   manuallyDistributeFunds,
//   getPaymentById,
//   getPaymentHistory,
//   fixPaymentData,
// };

// ===================================code working==========================================
// /* eslint-disable no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import Stripe from 'stripe';
// import config from '../../config';
// import Payment from './payment.model';
// import Project from '../project/project.model';
// import User from '../user/user.model';
// import AppError from '../../error/appError';
// import AssignHour from '../assignHours/assignHours.model';
// import pagination, { IOption } from '../../helper/pagenation';

// const stripe = new Stripe(config.stripe.secretKey!, {
//   apiVersion: '2023-08-16',
// } as any);

// // Utility function to update engineer completed projects
// const updateEngineerCompletedProjects = async (engineerId: string) => {
//   console.log(`📊 Incrementing project count for engineer: ${engineerId}`);

//   try {
//     const result = await User.findByIdAndUpdate(
//       engineerId,
//       {
//         $inc: { completedProjectsCount: 1 },
//       },
//       { new: true },
//     );

//     if (!result) {
//       console.warn(`⚠️ Engineer not found: ${engineerId}`);
//       return;
//     }

//     console.log(
//       `✅ Engineer ${engineerId} - Completed Projects: ${result.completedProjectsCount}`,
//     );
//   } catch (error: any) {
//     console.error(`❌ Error updating engineer ${engineerId}:`, error.message);
//   }
// };

// // Validate and prepare engineer data
// const validateAndPrepareEngineerData = async (
//   projectId: string,
//   approvedEngineers: any[],
// ) => {
//   const validatedEngineers = [];
//   let hasValidEngineers = false;

//   for (const approvedEng of approvedEngineers) {
//     const engineerId = approvedEng.engineer?._id || approvedEng.engineer;

//     if (!engineerId) {
//       console.warn('⚠️ Skipping engineer with no ID');
//       continue;
//     }

//     const engineer = await User.findById(engineerId);
//     if (!engineer) {
//       console.warn(`⚠️ Engineer ${engineerId} not found, skipping`);
//       continue;
//     }

//     // Get assigned hours for this engineer
//     const assignedHours = await AssignHour.findOne({
//       projectId,
//       engineerId: engineerId,
//     });

//     const hour = assignedHours?.hours || 0;
//     const rate = engineer.rate || 0;
//     const projectFee = hour * rate;

//     // Validate engineer has Stripe account
//     if (!engineer.stripeAccountId) {
//       console.warn(
//         `⚠️ Engineer ${engineer.firstName} has no Stripe account, will skip distribution`,
//       );
//     }

//     // Check if this is a valid engineer (has hours and rate)
//     if (hour > 0 && rate > 0) {
//       hasValidEngineers = true;
//     }

//     validatedEngineers.push({
//       engineer: engineerId,
//       hour,
//       rate,
//       projectFee,
//     });

//     console.log(`👨‍💻 Engineer ${engineer.firstName}:`, {
//       hour,
//       rate,
//       projectFee,
//       hasStripe: !!engineer.stripeAccountId,
//     });
//   }

//   return { validatedEngineers, hasValidEngineers };
// };

// // Create Checkout Session
// const createCheckoutSession = async (projectId: string, clientId: string) => {
//   // Validate inputs
//   if (!projectId) {
//     throw new AppError(400, 'Project ID is required');
//   }

//   const project = await Project.findById(projectId)
//     .populate('client')
//     .populate({
//       path: 'approvedEngineers.engineer',
//       model: 'User',
//     });

//   if (!project) {
//     throw new AppError(404, 'Project not found');
//   }

//   if (!project.client || project.client._id.toString() !== clientId) {
//     throw new AppError(403, 'Only the client can pay for this project');
//   }

//   if (!project.totalPaid || project.totalPaid <= 0) {
//     throw new AppError(400, 'Project totalPaid must be greater than 0');
//   }

//   // Validate project has approved engineers
//   if (!project.approvedEngineers || project.approvedEngineers.length === 0) {
//     throw new AppError(400, 'Project has no approved engineers');
//   }

//   // Prepare and validate engineer data
//   const { validatedEngineers, hasValidEngineers } =
//     await validateAndPrepareEngineerData(projectId, project.approvedEngineers);

//   if (!hasValidEngineers) {
//     throw new AppError(400, 'No engineers with valid hours and rates found');
//   }

//   const amountInCents = Math.round(project.totalPaid * 100);
//   const adminFeeInCents = Math.floor(amountInCents * 0.1); // 10% admin fee
//   const transferGroup = `project_${projectId}_${Date.now()}`;

//   // Create Stripe checkout session
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     customer_email: (project.client as any)?.email,
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           unit_amount: amountInCents,
//           product_data: {
//             name: `Payment for ${project.title}`,
//             description: `Project involving ${validatedEngineers.length} engineer(s)`,
//           },
//         },
//         quantity: 1,
//       },
//     ],
//     mode: 'payment',
//     payment_intent_data: {
//       transfer_group: transferGroup,
//     },
//     success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.frontendUrl}/payment-cancel`,
//     metadata: { projectId, clientId },
//   });

//   // Create payment record
//   const payment = await Payment.create({
//     projectId,
//     clientId,
//     stripeSessionId: session.id,
//     amount: project.totalPaid,
//     approvedEngineers: validatedEngineers,
//     transferGroup,
//     adminFee: adminFeeInCents / 100, // Store admin fee amount
//     status: 'pending',
//   });

//   return {
//     sessionId: session.id,
//     url: session.url,
//     paymentId: payment._id,
//     adminFee: adminFeeInCents / 100,
//     engineersCount: validatedEngineers.length,
//   };
// };

// // Distribute Funds with Admin Fee Handling
// const distributeFunds = async (paymentId: string) => {
//   console.log(`🚀 Starting fund distribution for payment: ${paymentId}`);

//   const payment = await Payment.findById(paymentId).populate(
//     'approvedEngineers.engineer',
//   );

//   if (!payment) {
//     throw new AppError(404, 'Payment not found');
//   }

//   if (payment.status !== 'paid') {
//     throw new AppError(400, 'Payment must be paid status to distribute');
//   }

//   const totalAmountInCents = Math.round(payment.amount * 100);
//   const adminFeeInCents = Math.floor(totalAmountInCents * 0.1);
//   const engineerAmountInCents = totalAmountInCents - adminFeeInCents;

//   console.log('💰 Payment breakdown:', {
//     total: payment.amount,
//     adminFee: adminFeeInCents / 100,
//     forEngineers: engineerAmountInCents / 100,
//   });

//   const engineers = payment.approvedEngineers;
//   if (!engineers || engineers.length === 0) {
//     throw new AppError(400, 'No approved engineers found');
//   }

//   // Calculate total project fee
//   const totalProjectFee = engineers.reduce(
//     (sum, e) => sum + (e.projectFee || 0),
//     0,
//   );

//   if (totalProjectFee <= 0) {
//     throw new AppError(400, 'Engineers project fee invalid');
//   }

//   const transfers: any[] = [];
//   let successfulTransfers = 0;

//   // ✅ STEP 1: Transfer Admin Fee to Platform Account (if configured)
//   if (adminFeeInCents > 0 && config.stripe.platformAccountId) {
//     try {
//       console.log(
//         `💰 Transferring admin fee $${adminFeeInCents / 100} to platform account...`,
//       );

//       const adminTransfer = await stripe.transfers.create({
//         amount: adminFeeInCents,
//         currency: 'usd',
//         destination: config.stripe.platformAccountId,
//         transfer_group: payment.transferGroup,
//         description: `Admin fee for project ${payment.projectId}`,
//       });

//       console.log(`✅ Admin fee transferred:`, adminTransfer.id);

//       transfers.push({
//         amount: adminFeeInCents / 100,
//         transferId: adminTransfer.id,
//         timestamp: new Date(),
//         type: 'admin_fee',
//         description: 'Platform admin fee',
//       });
//     } catch (error: any) {
//       console.error('❌ Admin fee transfer failed:', error.message);
//       // Continue with engineer distribution even if admin fee transfer fails
//     }
//   }

//   // ✅ STEP 2: Distribute to engineers
//   for (const [index, e] of engineers.entries()) {
//     const user: any = await User.findById(e.engineer);

//     if (!user?.stripeAccountId) {
//       console.warn(`⚠️ Engineer ${e.engineer} has no Stripe account, skipping`);
//       continue;
//     }

//     const shareInCents = Math.floor(
//       ((e.projectFee || 0) / totalProjectFee) * engineerAmountInCents,
//     );

//     if (shareInCents <= 0) {
//       console.warn(`⚠️ Share is 0 for engineer ${user.firstName}, skipping`);
//       continue;
//     }

//     try {
//       console.log(
//         `🔄 Transferring $${shareInCents / 100} to ${user.firstName}`,
//       );

//       const transfer = await stripe.transfers.create({
//         amount: shareInCents,
//         currency: 'usd',
//         destination: user.stripeAccountId,
//         transfer_group: payment.transferGroup,
//         description: `Payment for project ${payment.projectId}`,
//       });

//       console.log(`✅ Transfer successful:`, transfer.id);
//       successfulTransfers++;

//       transfers.push({
//         engineer: user._id,
//         amount: shareInCents / 100,
//         transferId: transfer.id,
//         timestamp: new Date(),
//         type: 'engineer_payment',
//       });
//     } catch (error: any) {
//       console.error(`❌ Transfer failed for ${user.firstName}:`, error.message);
//       // Continue with other engineers even if one fails
//     }
//   }

//   // Update payment
//   payment.adminFee = adminFeeInCents / 100;
//   payment.engineerFee = engineerAmountInCents / 100;
//   payment.transfers = transfers;

//   // Determine status based on success
//   if (successfulTransfers > 0) {
//     payment.status = 'distributed';
//     console.log(
//       `✅ Distribution completed: ${successfulTransfers} engineers paid`,
//     );
//   } else {
//     payment.status = 'failed';
//     console.log('❌ Distribution failed: No successful transfers');
//   }

//   await payment.save();

//   // ✅ STEP 3: ইঞ্জিনিয়ারদের লেভেল এবং ব্যাজ আপডেট করুন - এখানে যোগ করুন
//   console.log('🏆 Starting engineer level and badge updates...');
//   for (const e of engineers) {
//     try {
//       await updateEngineerCompletedProjects(e.engineer as any);
//       console.log(`✅ Updated level/badge for engineer: ${e.engineer}`);
//     } catch (error: any) {
//       console.error(
//         `❌ Failed to update engineer ${e.engineer}:`,
//         error.message,
//       );
//       // Continue with other engineers even if one fails
//     }
//   }
//   console.log('🏆 Engineer level & badges update process completed');

//   // Update engineer completed projects for successful transfers
//   if (successfulTransfers > 0) {
//     console.log('🏆 Updating engineer completed projects...');
//     for (const eng of engineers) {
//       try {
//         await updateEngineerCompletedProjects(eng.engineer.toString());
//       } catch (error: any) {
//         console.error(
//           `⚠️ Failed to update engineer ${eng.engineer}:`,
//           error.message,
//         );
//       }
//     }
//   }

//   return {
//     totalAmount: payment.amount,
//     adminFee: payment.adminFee,
//     engineerFee: payment.engineerFee,
//     successfulTransfers,
//     totalTransfers: transfers.length,
//     status: payment.status,
//     message: config.stripe.platformAccountId
//       ? `Admin fee of $${payment.adminFee} transferred to platform account`
//       : `Admin fee of $${payment.adminFee} remains in your Stripe balance`,
//   };
// };

// // Handle Webhook
// const handleWebhook = async (rawBody: Buffer, sig: string) => {
//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       rawBody,
//       sig,
//       config.stripe.webhookSecret!,
//     );
//   } catch (err: any) {
//     console.error('❌ Webhook verification failed:', err.message);
//     throw new AppError(400, 'Webhook verification failed: ' + err.message);
//   }

//   console.log(`📨 Received webhook event: ${event.type}`);

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as Stripe.Checkout.Session;
//     console.log(`🛒 Checkout session completed: ${session.id}`);

//     const payment = await Payment.findOne({ stripeSessionId: session.id });

//     if (!payment) {
//       console.error('❌ Payment not found for session:', session.id);
//       return { received: true };
//     }

//     console.log(`📝 Updating payment status to paid: ${payment._id}`);
//     payment.status = 'paid';
//     payment.stripePaymentIntentId = session.payment_intent as string;
//     await payment.save();

//     try {
//       console.log(`🔄 Starting auto-distribution for payment: ${payment._id}`);
//       const result = await distributeFunds(payment._id.toString());
//       console.log(`✅ Auto-distribution completed:`, result);
//     } catch (error: any) {
//       console.error('❌ Auto-distribution failed:', error.message);

//       // Update payment status to failed
//       payment.status = 'failed';
//       await payment.save();

//       console.error('Full error:', error);
//     }
//   }

//   return { received: true };
// };

// // Manual distribution function
// const manuallyDistributeFunds = async (paymentId: string) => {
//   console.log(`🛠️ Manual distribution requested for: ${paymentId}`);

//   const payment = await Payment.findById(paymentId);

//   if (!payment) throw new AppError(404, 'Payment not found');

//   if (payment.status === 'distributed') {
//     throw new AppError(400, 'Payment has already been distributed');
//   }

//   if (payment.status !== 'paid') {
//     throw new AppError(400, 'Payment must be paid status to distribute');
//   }

//   try {
//     const result = await distributeFunds(paymentId);
//     console.log(`✅ Manual distribution successful for: ${paymentId}`);
//     return result;
//   } catch (error: any) {
//     console.error(
//       `❌ Manual distribution failed for ${paymentId}:`,
//       error.message,
//     );

//     // Update payment status to failed
//     payment.status = 'failed';
//     await payment.save();

//     throw error;
//   }
// };

// // Get payment by ID
// const getPaymentById = async (paymentId: string) => {
//   const payment = await Payment.findById(paymentId)
//     .populate('projectId')
//     .populate('clientId')
//     .populate('approvedEngineers.engineer')
//     .populate('transfers.engineer');

//   if (!payment) throw new AppError(404, 'Payment not found');

//   return payment;
// };

// // Get payment history
// const getPaymentHistory = async (
//   userId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);
//   const { searchTerm, ...filterData } = params;

//   // Check user
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(404, 'User not found');

//   const andCondition: any[] = [];

//   // Role-based filtering
//   if (user.role === 'user') {
//     andCondition.push({ clientId: user._id });
//   } else if (user.role === 'engineer') {
//     andCondition.push({ 'approvedEngineers.engineer': user._id });
//   }
//   // Admin sees all payments - no filter needed

//   const searchableFields = ['currency', 'status', 'stripePaymentIntentId'];

//   if (searchTerm) {
//     andCondition.push({
//       $or: searchableFields.map((field) => ({
//         [field]: { $regex: searchTerm, $options: 'i' },
//       })),
//     });
//   }

//   if (Object.keys(filterData).length) {
//     andCondition.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

//   const result = await Payment.find(whereCondition)
//     .populate('clientId', 'firstName lastName email')
//     .populate('projectId', 'title status')
//     .populate('approvedEngineers.engineer', 'firstName lastName email rate')
//     .populate('transfers.engineer', 'firstName lastName')
//     .skip(skip)
//     .limit(limit)
//     .sort({ [sortBy]: sortOrder } as any);

//   const total = await Payment.countDocuments(whereCondition);

//   return {
//     data: result,
//     meta: {
//       total,
//       page,
//       limit,
//     },
//   };
// };

// // Fix payment data utility
// const fixPaymentData = async (paymentId: string) => {
//   const payment = await Payment.findById(paymentId);
//   if (!payment) {
//     throw new AppError(404, 'Payment not found');
//   }

//   const project = await Project.findById(payment.projectId);
//   if (!project) {
//     throw new AppError(404, 'Project not found');
//   }

//   const { validatedEngineers } = await validateAndPrepareEngineerData(
//     payment.projectId.toString(),
//     (project as any).approvedEngineers,
//   );

//   payment.approvedEngineers = validatedEngineers;
//   await payment.save();

//   return {
//     message: 'Payment data fixed successfully',
//     paymentId: payment._id,
//     engineersCount: validatedEngineers.length,
//     engineers: validatedEngineers,
//   };
// };

// // Check platform balance and fees
// const checkPlatformBalance = async () => {
//   try {
//     const balance = await stripe.balance.retrieve();

//     console.log('💰 Platform Balance Summary:');
//     balance.available.forEach((b) => {
//       console.log(`  - Available: $${b.amount / 100} ${b.currency}`);
//     });
//     balance.pending.forEach((b) => {
//       console.log(`  - Pending: $${b.amount / 100} ${b.currency}`);
//     });

//     return balance;
//   } catch (error: any) {
//     console.error('❌ Error checking platform balance:', error.message);
//   }
// };

// export const paymentService = {
//   createCheckoutSession,
//   distributeFunds,
//   handleWebhook,
//   manuallyDistributeFunds,
//   getPaymentById,
//   getPaymentHistory,
//   fixPaymentData,
//   checkPlatformBalance,
// };

// ================================== update code ==============================================
import Stripe from 'stripe';
import config from '../../config';
import Payment from './payment.model';
import Project from '../project/project.model';
import User from '../user/user.model';
import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';

const stripe = new Stripe(config.stripe.secretKey!, {
  apiVersion: '2023-08-16',
} as any);

/* ======================================================
   PREPARE ENGINEER PAYMENT DATA (FROM PROJECT MODEL)
====================================================== */
const prepareEngineerPaymentData = async (project: any) => {
  const approvedEngineers = project.approvedEngineers || [];
  const result = [];
  let hasValid = false;

  for (const eng of approvedEngineers) {
    const engineerId = eng.engineer?._id || eng.engineer;
    const engineer = await User.findById(engineerId);

    if (!engineer) continue;

    const allocatedHours = eng.allocatedHours || 0;
    const rate = engineer.rate || 0;
    const projectFee = allocatedHours * rate;

    if (allocatedHours > 0 && rate > 0) hasValid = true;

    result.push({
      engineer: engineerId,
      hour: allocatedHours, // Payment model SAME
      rate,
      projectFee,
    });
  }

  return { engineers: result, hasValid };
};

/* ======================================================
   CREATE CHECKOUT SESSION
====================================================== */
const createCheckoutSession = async (projectId: string, clientId: string) => {
  const project = await Project.findById(projectId)
    .populate('client')
    .populate('approvedEngineers.engineer');

  if (!project) throw new AppError(404, 'Project not found');

  if (project.client._id.toString() !== clientId)
    throw new AppError(403, 'Unauthorized');

  if (!project.totalPaid || project.totalPaid <= 0)
    throw new AppError(400, 'Invalid project amount');

  if (!project.approvedEngineers?.length)
    throw new AppError(400, 'No approved engineers');

  const { engineers, hasValid } = await prepareEngineerPaymentData(project);

  if (!hasValid) throw new AppError(400, 'Invalid engineer hour or rate');

  const amountInCents = Math.round(project.totalPaid * 100);
  const transferGroup = `project_${projectId}_${Date.now()}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: (project.client as any).email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: {
            name: `Payment for ${project.title}`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_intent_data: { transfer_group: transferGroup },
    success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment-cancel`,
    metadata: { projectId, clientId },
  });

  const payment = await Payment.create({
    projectId,
    clientId,
    stripeSessionId: session.id,
    amount: project.totalPaid,
    approvedEngineers: engineers,
    transferGroup,
    status: 'pending',
  });

  return {
    sessionId: session.id,
    url: session.url,
    paymentId: payment._id,
  };
};

/* ======================================================
   DISTRIBUTE FUNDS
====================================================== */
const distributeFunds = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) throw new AppError(404, 'Payment not found');
  if (payment.status !== 'paid') throw new AppError(400, 'Payment not paid');

  const totalCents = Math.round(payment.amount * 100);
  const adminFeeCents = Math.floor(totalCents * 0.1);
  const engineerCents = totalCents - adminFeeCents;

  const engineers = payment.approvedEngineers;
  const totalProjectFee = engineers.reduce(
    (s, e) => s + (e.projectFee || 0),
    0,
  );

  if (totalProjectFee <= 0) throw new AppError(400, 'Invalid project fee');

  const transfers: any[] = [];
  let successCount = 0;

  // Admin fee
  if (config.stripe.platformAccountId) {
    await stripe.transfers.create({
      amount: adminFeeCents,
      currency: 'usd',
      destination: config.stripe.platformAccountId,
      transfer_group: payment.transferGroup,
    });
  }

  // Engineer payments
  for (const e of engineers) {
    const user: any = await User.findById(e.engineer);
    if (!user?.stripeAccountId) continue;

    const share = Math.floor(
      ((e.projectFee || 0) / totalProjectFee) * engineerCents,
    );

    if (share <= 0) continue;

    const transfer = await stripe.transfers.create({
      amount: share,
      currency: 'usd',
      destination: user.stripeAccountId,
      transfer_group: payment.transferGroup,
    });

    transfers.push({
      engineer: user._id,
      amount: share / 100,
      transferId: transfer.id,
    });

    successCount++;
  }

  payment.adminFee = adminFeeCents / 100;
  payment.engineerFee = engineerCents / 100;
  payment.transfers = transfers;
  payment.status = successCount ? 'distributed' : 'failed';

  await payment.save();
  return payment;
};

/* ======================================================
   WEBHOOK
====================================================== */
const handleWebhook = async (rawBody: Buffer, sig: string) => {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    sig,
    config.stripe.webhookSecret!,
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await Payment.findOne({
      stripeSessionId: session.id,
    });

    if (!payment) return { received: true };

    payment.status = 'paid';
    payment.stripePaymentIntentId = session.payment_intent as string;
    await payment.save();

    await distributeFunds(payment._id.toString());
  }

  return { received: true };
};

/* ======================================================
   GET PAYMENT HISTORY
====================================================== */
const getPaymentHistory = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip } = pagination(options);
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const where: any = {};
  if (user.role === 'user') where.clientId = user._id;
  if (user.role === 'engineer') where['approvedEngineers.engineer'] = user._id;

  const data = await Payment.find(where)
    .populate('projectId', 'title')
    .populate('approvedEngineers.engineer', 'firstName lastName')
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments(where);

  return { data, meta: { total, page, limit } };
};

export const paymentService = {
  createCheckoutSession,
  distributeFunds,
  handleWebhook,
  getPaymentHistory,
};
