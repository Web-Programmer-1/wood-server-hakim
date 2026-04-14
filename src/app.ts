/**
 * Stateless API: auth via JWT (Authorization / cookies), no server-side sessions.
 * OTP/tokens use Redis when REDIS_URL is set — shared across scaled instances.
 */
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import notFound from './app/middlewares/notFound';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import config from './config';
import router from './app/routes';
import cookieParser from 'cookie-parser'
import cron from 'node-cron';
import { globalLimiter } from './app/middlewares/rateLimit';
import healthRoutes from './health/health.routes';

const app: Application = express();

// Probes before rate limit so ALB/ECS health checks are never throttled
app.use('/health', healthRoutes);

app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true
}));

// Rate Limit for Illegal Requests
app.use(globalLimiter);


//parser
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



// Avoid duplicate side effects when multiple instances run (scale-out). Enable only if needed.
if (process.env.ENABLE_DEBUG_CRON === 'true') {
    cron.schedule('* * * * *', () => {
        try {
            console.log("Node cron called at ", new Date())
        } catch (err) {
            console.error(err);
        }
    });
}

app.use("/api/v1", router);

app.get('/', (req: Request, res: Response) => {
    res.send({
        message: "Server is running..",
        environment: config.node_env,
        uptime: process.uptime().toFixed(2) + " sec",
        timeStamp: new Date().toISOString()
    })
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;