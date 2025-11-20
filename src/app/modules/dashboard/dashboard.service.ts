import Booking from '../booking/booking.model';
import Project from '../project/project.model';
import User from '../user/user.model';

const dashboardOverView = async () => {
  const totalErning = '';
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
    totalErning,
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
      { approvedEngineers: userId },
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

  const upcomingMeeting = await Booking.countDocuments({
    userId,
    date: { $gte: new Date() },
  });

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

export const dashboardService = {
  dashboardOverView,
  userDashboardOverview,
};
