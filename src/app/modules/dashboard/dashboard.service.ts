import mongoose from 'mongoose';
import Booking from '../booking/booking.model';
import paymentModel from '../payment/payment.model';
import Project from '../project/project.model';
import User from '../user/user.model';

const dashboardOverView = async () => {
  const totalErningAdmin = await paymentModel.aggregate([
    {
      $match: { status: { $in: ['paid', 'distributed'] } },
    },
    {
      $group: {
        _id: null,
        totalAdminFee: { $sum: '$adminFee' },
      },
    },
  ]);

  const totalEarning = totalErningAdmin.length
    ? totalErningAdmin[0].totalAdminFee
    : 0;
  const totaActivelUser = await User.countDocuments({ status: 'active' });
  const totalActiveProject = await Project.countDocuments({
    status: 'in_progress',
  });
  const totalPandingProject = await Project.countDocuments({
    status: 'pending',
  });

  const totalCompletedProject = await Project.countDocuments({
    status: 'completed',
  });

  return {
    totalEarning,
    totaActivelUser,
    totalActiveProject,
    totalPandingProject,
    totalCompletedProject,
  };
};

const userDashboardOverview = async (userId: string) => {
  // Only projects created by this user
  const matchUser = { client: userId };

  const totalActiveProject = await Project.countDocuments({
    status: 'in_progress',
    ...matchUser,
  });

  const totalPendingProject = await Project.countDocuments({
    status: 'pending',
    ...matchUser,
  });

  const totalCompletedProject = await Project.countDocuments({
    status: 'completed',
    ...matchUser,
  });

  // User's project IDs
  const userProjects = await Project.find(matchUser).select('_id');
  const projectIds = userProjects.map(p => p._id);

  // Upcoming meetings for user's projects
  const upcomingMeeting = await Booking.countDocuments({
    projectId: { $in: projectIds },
    date: { $gte: new Date() },
  });

  // Upcoming deadlines for user's projects
  const upcomingDeadlines = await Project.countDocuments({
    _id: { $in: projectIds },
    deliveryDate: { $gte: new Date() },
  });

  return {
    totalActiveProject,
    totalPendingProject,
    totalCompletedProject,
    upcomingMeeting,
    upcomingDeadlines,
  };
};


const engineerDashboardOverview = async (engineerId: string) => {
  const matchEngineer = {
    $or: [
      { "engineers.engineer": new mongoose.Types.ObjectId(engineerId) },
      { "approvedEngineers.engineer": new mongoose.Types.ObjectId(engineerId) },
    ],
  };

  // Project counts
  const totalActiveProject = await Project.countDocuments({
    status: 'in_progress',
    ...matchEngineer,
  });

  const totalPendingProject = await Project.countDocuments({
    status: 'pending',
    ...matchEngineer,
  });

  const totalCompletedProject = await Project.countDocuments({
    status: 'completed',
    ...matchEngineer,
  });

  // Engineer project IDs
  const engineerProjects = await Project.find(matchEngineer).select('_id');
  const projectIds = engineerProjects.map(p => p._id);

  // Upcoming meetings
  const upcomingMeeting = await Booking.countDocuments({
    projectId: { $in: projectIds },
    date: { $gte: new Date() },
  });

  // Upcoming deadlines
  const upcomingDeadlines = await Project.countDocuments({
    _id: { $in: projectIds },
    deliveryDate: { $gte: new Date() },
  });

  // Payments — total earned & pending
  const payments = await paymentModel.aggregate([
    { $match: { "approvedEngineers.engineer": new mongoose.Types.ObjectId(engineerId) } },
    { $unwind: "$approvedEngineers" },
    { $match: { "approvedEngineers.engineer": new mongoose.Types.ObjectId(engineerId) } },
    {
      $group: {
        _id: "$approvedEngineers.engineer",
        totalEarned: { $sum: "$approvedEngineers.scaledProjectFee" },
        pendingPayments: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid"] }, 0, "$approvedEngineers.scaledProjectFee"],
          },
        },
      },
    },
  ]);

  const totalEarned = payments[0]?.totalEarned || 0;
  // const pendingPayments = payments[0]?.pendingPayments || 0;

  return {
    totalActiveProject,
    totalPendingProject,
    totalCompletedProject,
    upcomingMeeting,
    upcomingDeadlines,
    totalEarned,
    // pendingPayments,
  };
};


const getMonthlyEarnings = async (year: number) => {
  const earnings = await paymentModel.aggregate([
    {
      $match: {
        status: 'distributed',
        createdAt: {
          $gte: new Date(`${year}-01-01T00:00:00Z`),
          $lte: new Date(`${year}-12-31T23:59:59Z`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        totalEarnings: { $sum: '$adminFee' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const monthlyData = months.map((month, index) => {
    const found = earnings.find((e) => e._id === index + 1);
    return {
      month,
      totalEarnings: found ? found.totalEarnings : 0,
    };
  });

  return monthlyData;
};


export const dashboardService = {
  dashboardOverView,
  userDashboardOverview,
  getMonthlyEarnings,
  engineerDashboardOverview
};
