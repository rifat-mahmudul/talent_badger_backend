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
  const matchUser = {
    $or: [
      { client: userId },
      { engineers: userId },
    { "approvedEngineers.engineer": userId },
    ],
  };

  const totalActiveProject = await Project.countDocuments({
    status: 'in_progress',
    ...matchUser,
  });

  const totalPandingProject = await Project.countDocuments({
    status: 'pending',
    ...matchUser,
  });

  const totalCompletedProject = await Project.countDocuments({
    status: 'completed',
    ...matchUser,
  });

  // 🔥 NEW — Engineer upcoming meeting fix
  const engineerProjects = await Project.find(matchUser).select('_id');
  const projectIds = engineerProjects.map(p => p._id);

  const upcomingMeeting = await Booking.countDocuments({
    projectId: { $in: projectIds },
    date: { $gte: new Date() },
  });

  // const upcomingDeadlines = await Project.countDocuments({
  //   deliveryDate: { $gte: new Date() },
  //   ...matchUser,
  // });


  const upcomingDeadlines = await Project.countDocuments({
    deliveryDate: { $gte: new Date() },
    ...matchUser,
  });

  return {
    totalActiveProject,
    totalPandingProject,
    totalCompletedProject,
    upcomingMeeting,
    upcomingDeadlines,
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
  getMonthlyEarnings
};
