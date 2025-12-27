import express from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { CategoryRoutes } from '../modules/category/category.route';
import { MachineRoutes } from '../modules/machine/machine.route';
import { ProductCategoryRoutes } from '../modules/productCategory/productCategory.route';
import { ProductRoutes } from '../modules/products/product.route';

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
    {
        path: '/productCategory',
        route: ProductCategoryRoutes
    },
    {
        path: '/products',
        route: ProductRoutes
    },





];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;
