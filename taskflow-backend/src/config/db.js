import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @desc Connects to the MongoDB database using Mongoose.
 */
const connectDB = async () => {
  try {
    // Configure Mongoose connection pooling for production concurrency
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50, // Maintain up to 50 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;