import express from 'express';



import { authRouter } from '../modules/auth/auth.routes';
import { CategoryRoutes } from '../modules/category/category.route';
import { MachineRoutes } from '../modules/machine/machine.route';

const router = express.Router();

const moduleRoutes = [

    {
        path: '/auth',
        route: authRouter
    },
    {
        path: '/category',
        route: CategoryRoutes
    },
    {
        path: '/machines',
        route: MachineRoutes
    },





];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;
