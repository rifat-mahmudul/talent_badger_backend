import { Router } from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { serviceRoutes } from '../modules/service/service.routes';
import { industryRouter } from '../modules/industri/industri.routes';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
