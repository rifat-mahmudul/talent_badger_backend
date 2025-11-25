import AppError from '../../error/appError';
import Project from '../project/project.model';
import User from '../user/user.model';
import { IAssignHours } from './assignHours.interface';
import AssignHour from './assignHours.model';

// const createAssignHour = async (managerId: string, payload: IAssignHours) => {
//   // Manager check
//   const manager = await User.findById(managerId);
//   if (!manager) throw new AppError(404, 'Manager not found');
//   if (!manager.ismanager) throw new AppError(403, 'You are not a manager');

//   // Project check
//   const project = await Project.findById(payload.projectId);
//   if (!project) throw new AppError(404, 'Project not found');

//   // Engineer check (allow manager himself)
//   if (
//     payload.engineerId.toString() !== managerId && // manager নিজেকে ছাড়া
//     !project.approvedEngineers?.some(
//       (id) => id.toString() === payload.engineerId.toString(),
//     )
//   ) {
//     throw new AppError(400, 'This engineer is not approved for this project');
//   }

//   // Engineer info
//   const engineer = await User.findById(payload.engineerId);
//   if (!engineer) throw new AppError(404, 'Engineer not found');
//   if (!engineer.rate || engineer.rate <= 0)
//     throw new AppError(400, 'Engineer rate not set');

//   // Budget calculation
//   const adminPercentage = 10;
//   const adminAmount = (project.totalPaid! * adminPercentage) / 100;
//   const usableBudget = project.totalPaid! - adminAmount;

//   const usedAmount = project.usedAmount ?? 0;
//   const remainingBudget = usableBudget - usedAmount;

//   const assignCost = engineer.rate * payload.hours;

//   if (assignCost > remainingBudget) {
//     throw new AppError(
//       400,
//       `Not enough budget. Maximum assignable hours: ${Math.floor(remainingBudget / engineer.rate)}`,
//     );
//   }

//   // Save AssignHour
//   const result = await AssignHour.create({
//     ...payload,
//     managerId: manager._id,
//   });

//   // Update project usedAmount
//   project.usedAmount = usedAmount + assignCost;
//   await project.save();

//   result.amount = assignCost;
//   await result.save();

//   return {
//     message: 'Hours assigned successfully',
//     assignedTo: engineer.firstName,
//     engineerRate: engineer.rate,
//     assignedHours: payload.hours,
//     cost: assignCost,

//     totalPaid: project.totalPaid,
//     adminCharge: adminAmount,
//     usableBudget,
//     usedAmount: project.usedAmount,
//     remainingBudget: usableBudget - project.usedAmount,

//     data: result,
//   };
// };

const createAssignHour = async (managerId: string, payload: IAssignHours) => {
  // Manager check
  const manager = await User.findById(managerId);
  if (!manager) throw new AppError(404, 'Manager not found');
  if (!manager.ismanager) throw new AppError(403, 'You are not a manager');

  // Project check
  const project = await Project.findById(payload.projectId);
  if (!project) throw new AppError(404, 'Project not found');

  // Engineer check (allow manager himself)
  if (
    payload.engineerId.toString() !== managerId &&
    !project.approvedEngineers?.some(
      (eng) => eng.engineer.toString() === payload.engineerId.toString(),
    )
  ) {
    throw new AppError(400, 'This engineer is not approved for this project');
  }

  // Engineer info
  const engineer = await User.findById(payload.engineerId);
  if (!engineer) throw new AppError(404, 'Engineer not found');
  if (!engineer.rate || engineer.rate <= 0)
    throw new AppError(400, 'Engineer rate not set');

  // Budget calculation
  const adminPercentage = 10;
  const adminAmount = (project.totalPaid! * adminPercentage) / 100;
  const usableBudget = project.totalPaid! - adminAmount;
  const usedAmount = project.usedAmount ?? 0;
  const remainingBudget = usableBudget - usedAmount;
  const assignCost = engineer.rate * payload.hours;

  if (assignCost > remainingBudget) {
    throw new AppError(
      400,
      `Not enough budget. Maximum assignable hours: ${Math.floor(
        remainingBudget / engineer.rate,
      )}`,
    );
  }

  // Save AssignHour
  const result = await AssignHour.create({
    ...payload,
    managerId: manager._id,
    amount: assignCost,
  });

  // Update project usedAmount
  project.usedAmount = usedAmount + assignCost;
  await project.save();

  return {
    message: 'Hours assigned successfully',
    assignedTo: engineer.firstName,
    engineerRate: engineer.rate,
    assignedHours: payload.hours,
    cost: assignCost,

    totalPaid: project.totalPaid,
    adminCharge: adminAmount,
    usableBudget,
    usedAmount: project.usedAmount,
    remainingBudget: usableBudget - project.usedAmount,

    data: result,
  };
};

export const assignHoursService = {
  createAssignHour,
};
