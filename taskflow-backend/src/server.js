import dotenv from 'dotenv';
// CRITICAL FIX: Ensure environment variables are loaded immediately, 
// even before other imports if your setup supports it, but placing it
// directly after the dotenv import is the safer ESM standard.
dotenv.config();

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

// Connect to MongoDB (Must run AFTER dotenv.config())
connectDB();

const app = express();
const httpServer = createServer(app);

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

app.use(helmet());
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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

// === ERROR HANDLING MIDDLEWARE ===
app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => console.log(`TaskFlow Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));