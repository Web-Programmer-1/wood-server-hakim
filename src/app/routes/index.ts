import express from 'express';



import { authRouter } from '../modules/auth/auth.routes';
import { categoryRoutes } from '../modules/category/category.route';
import { machineRoutes } from '../modules/machine/machine.route';



const router = express.Router();

const moduleRoutes = [

    {
        path: '/auth',
        route: authRouter
    },
    
    {
        path: '/category',
        route: categoryRoutes
    },
    {
        path: '/machine',
        route: machineRoutes
    },


];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;
