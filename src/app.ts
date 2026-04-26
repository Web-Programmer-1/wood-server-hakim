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
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { globalLimiter } from './app/middlewares/rateLimit';
import healthRoutes from './health/health.routes';

const app: Application = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  "http://localhost:3000", 
  "https://woodtechsolutionbd.com",
  "https://www.woodtechsolutionbd.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman / curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options('/{*splat}', cors());

// Probes before rate limit so ALB/ECS health checks are never throttled
app.use('/health', healthRoutes);

// Rate Limit for Illegal Requests
app.use(globalLimiter);

// parsers
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cron (optional)
if (process.env.ENABLE_DEBUG_CRON === 'true') {
  cron.schedule('* * * * *', () => {
    try {
      console.log("Node cron called at ", new Date());
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
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;