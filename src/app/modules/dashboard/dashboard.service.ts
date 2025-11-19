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

export const dashboardService = {
  dashboardOverView,
};
