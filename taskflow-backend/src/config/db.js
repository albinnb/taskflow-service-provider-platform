import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @desc Connects to the MongoDB database using Mongoose.
 */
const connectDB = async () => {
  try {
    // Attempt to connect to the MongoDB URI from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;