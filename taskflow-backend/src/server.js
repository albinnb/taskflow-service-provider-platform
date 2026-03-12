import dotenv from 'dotenv';
// CRITICAL FIX: Ensure environment variables are loaded immediately, 
// even before other imports if your setup supports it, but placing it
// directly after the dotenv import is the safer ESM standard.
dotenv.config();

import { validateEnv } from './config/envValidator.js';
// Validate required env vars before booting up anything else
validateEnv();

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './config/rateLimit.js';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import socketHandler from './socket/socketHandler.js';
import logger from './utils/logger.js'; // Production Logger

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js'; // Payment
import availabilityRoutes from './routes/availabilityRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js'; // Webhooks

// Connect to MongoDB (Must run AFTER dotenv.config())
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize Sentry early
Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0", // Mock/Fallback DSN
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  profilesSampleRate: 1.0, // Profile 100% of sampled transactions
});

// Allowed Origins
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:4173'];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true // Allow cookies
  }
});

// Initialize Socket.io
socketHandler(io);
const PORT = process.env.PORT || 5000;

// === MIDDLEWARE ===

// === MIDDLEWARE ===

// Helmet configuration allowing Swagger UI and basic development tools
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://validator.swagger.io"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Buffer the raw body for Razorpay webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(cookieParser());

// Use morgan to pipe HTTP request logs into Winston
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));


import { setupSwagger } from './config/swagger.js';

// Setup Swagger API Docs
setupSwagger(app);

app.use('/api', apiLimiter);
app.get('/', (req, res) => res.send('LocalLink API is running...'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);

// === ERROR HANDLING MIDDLEWARE ===
Sentry.setupExpressErrorHandler(app); // Must be before custom error handlers

app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => logger.info(`TaskFlow Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));