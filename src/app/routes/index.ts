import express from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { CategoryRoutes } from '../modules/category/category.route';
import { MachineRoutes } from '../modules/machine/machine.route';
import { ProductCategoryRoutes } from '../modules/productCategory/productCategory.route';
import { ProductRoutes } from '../modules/products/product.route';
import { CartRoutes } from '../modules/cart/cart.route';
import { OrderRoutes } from '../modules/order/order.route';
import { ReviewRoutes } from '../modules/review/review.route';
import { InquiryRoutes } from '../modules/inquiry/inquiry.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { adminPaymentRoutes } from '../modules/adminPayment/adminPayment.route';
import { BlogRoutes } from '../modules/blog/blog.route';
import { EventRoutes } from '../modules/event/event.route';
import { LandingRoutes } from '../modules/dynamicLandingPage/landing.routes';
import { AdminCouponRoutes } from '../modules/coupon/coupon.route';
import { InventoryRoutes } from '../modules/inventory/inventory.route';
import { AdminDashboardRoutes } from '../modules/adminDashboard/adminDashboard.route';
import { ServiceSectionRoutes } from '../modules/servicesPage/services.route';
import { TestimonialRoutes } from '../modules/servicesPage/testimoniral/testimoniral.route';
import { ConsultencyBannerRoutes } from '../modules/servicesPage/consultency/consultency.route';
import { FoundationStoryRoutes } from '../modules/servicesPage/foundation/foundation.route';


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
    {
        path: '/cart',
        route: CartRoutes,
    },
    {
        path: '/orders',
        route: OrderRoutes,
    },

    {
        path: '/review',
        route: ReviewRoutes,
    },
    {
        path: '/inquiries',
        route: InquiryRoutes,
    },
    {
        path: '/payments',
        route: PaymentRoutes,
    },
    {
        path: '/admin',
        route: adminPaymentRoutes,
    },
    {
        path: '/blogs',
        route: BlogRoutes,
    },
    {
        path: '/events',
        route: EventRoutes,
    },
    {
        path: '/landing',
        route: LandingRoutes,
    },
    {
        path: '/coupon',
        route: AdminCouponRoutes,
    },
    {
        path: '/inventory',
        route: InventoryRoutes,
    },
    {
        path: '/dashboard',
        route: AdminDashboardRoutes,
    },
    {
        path: '/services',
        route: ServiceSectionRoutes,
    },
    {
        path: '/testimonial',
        route: TestimonialRoutes,
    },
    {
        path: '/consultency',
        route: ConsultencyBannerRoutes,
    },
    {
        path: '/foundation',
        route: FoundationStoryRoutes,
    },

    





];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;
