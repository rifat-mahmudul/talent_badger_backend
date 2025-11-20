import { Router } from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { serviceRoutes } from '../modules/service/service.routes';
import { industryRouter } from '../modules/industri/industri.routes';
import { blogRouter } from '../modules/blog/blog.routes';
import { newsletterRouter } from '../modules/newsletter/newsletter.routes';
import { projectRouter } from '../modules/project/project.route';
import { contactRouter } from '../modules/contact/contact.routes';
import { reviewRouter } from '../modules/review/review.routes';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes';
import { bookingRouter } from '../modules/booking/booking.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/service',
    route: serviceRoutes,
  },
  {
    path: '/industry',
    route: industryRouter,
  },
  {
    path: '/blog',
    route: blogRouter,
  },
  {
    path: '/newsletter',
    route: newsletterRouter,
  },
  {
    path: '/project',
    route: projectRouter,
  },
  {
    path: '/contact',
    route: contactRouter,
  },
  {
    path: '/review',
    route: reviewRouter,
  },
  {
    path: '/dashboard',
    route: dashboardRouter,
  },
  {
    path: '/booking',
    route: bookingRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
