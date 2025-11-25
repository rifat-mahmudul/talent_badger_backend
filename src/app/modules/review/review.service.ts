import Review from './review.model';
import Project from '../project/project.model';
import User from '../user/user.model';
import AppError from '../../error/appError';

const addReview = async (
  clientId: string,
  projectId: string,
  engineerId: string,
  rating: number,
  review: string,
) => {
  const user = await User.findById(clientId);
  if (!user) throw new AppError(404, 'User not found');

  const project = await Project.findById(projectId);
  if (!project) throw new AppError(404, 'Project not found');

  if (project.client.toString() !== clientId) {
    throw new AppError(403, 'Only the project owner can review');
  }

  if (project.status !== 'completed') {
    throw new AppError(400, 'You can only review completed projects');
  }

  if (
    !project.approvedEngineers?.some((ae) => ae.engineer.equals(engineerId))
  ) {
    throw new AppError(400, 'This engineer did not work on this project');
  }

  const existing = await Review.findOne({
    project: projectId,
    engineer: engineerId,
  });
  if (existing) {
    throw new AppError(
      400,
      'You already reviewed this engineer for this project',
    );
  }

  const newReview = await Review.create({
    project: projectId,
    client: clientId,
    engineer: engineerId,
    rating,
    review,
  });

  const engineer = await User.findById(engineerId);
  if (engineer) {
    engineer.totalRating = (engineer.totalRating || 0) + rating;
    engineer.ratingCount = (engineer.ratingCount || 0) + 1;
    engineer.avgRating = engineer.totalRating / engineer.ratingCount;
    await engineer.save();
  }

  return newReview;
};

const getsingleReview = async (reviewId: string) => {
  const review = await Review.findById(reviewId)
    .populate('client', 'firstName lastName profileImage')
    .populate('project', 'title');
  if (!review) throw new AppError(404, 'Review not found');
  return review;
};

const getEngineerReviews = async (engineerId: string) => {
  const reviews = await Review.find({ engineer: engineerId })
    .populate('client', 'firstName lastName profileImage')
    .populate('project', 'title');
  return reviews;
};

const updateReview = async (
  userId: string,
  reviewId: string,
  newRating?: number,
  newReviewText?: string,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const review = await Review.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');

  if (review.client.toString() !== userId)
    throw new AppError(403, 'Only the review owner can update');

  const engineer = await User.findById(review.engineer);
  const oldRating = review.rating;

  if (typeof newRating === 'number') {
    review.rating = newRating;

    if (engineer) {
      engineer.totalRating =
        (engineer.totalRating || 0) - oldRating + newRating;
      engineer.avgRating =
        engineer.ratingCount && engineer.ratingCount > 0
          ? engineer.totalRating / engineer.ratingCount
          : 0;
      await engineer.save();
    }
  }

  if (typeof newReviewText === 'string' && newReviewText.trim() !== '') {
    review.review = newReviewText;
  }

  await review.save();

  return review;
};

const deleteReview = async (userId: string, reviewId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const review = await Review.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');

  if (review.client.toString() !== userId)
    throw new AppError(403, 'Only the review owner can delete');

  const engineer = await User.findById(review.engineer);
  if (engineer) {
    engineer.totalRating = (engineer.totalRating || 0) - review.rating;
    engineer.ratingCount = Math.max((engineer.ratingCount || 1) - 1, 0);
    engineer.avgRating =
      engineer.ratingCount > 0
        ? engineer.totalRating / engineer.ratingCount
        : 0;
    await engineer.save();
  }

  await review.deleteOne();
  return { message: 'Review deleted successfully' };
};

export const reviewService = {
  addReview,
  getEngineerReviews,
  getsingleReview,
  updateReview,
  deleteReview,
};
