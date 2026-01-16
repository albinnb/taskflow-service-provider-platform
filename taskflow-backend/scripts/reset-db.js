import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths for dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Model Imports
import User from '../src/models/User.js';
import Provider from '../src/models/Provider.js';
import Service from '../src/models/Service.js';
import Booking from '../src/models/Booking.js';
import Review from '../src/models/Review.js';
import Category from '../src/models/Category.js';

const resetDB = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. Confirm deletion
        console.log('Warning: This will delete ALL users, providers, services, bookings, and reviews.');
        console.log('Categories will be preserved.');

        // 2. Perform Deletions
        console.log('🗑️  Deleting Bookings...');
        await Booking.deleteMany({});

        console.log('🗑️  Deleting Reviews...');
        await Review.deleteMany({});

        console.log('🗑️  Deleting Services...');
        await Service.deleteMany({});

        console.log('🗑️  Deleting Providers...');
        await Provider.deleteMany({});

        console.log('🗑️  Deleting Users (All)...');
        await User.deleteMany({});

        // Optional: Ensure Categories still exist (just in case)
        const catCount = await Category.countDocuments();
        console.log(`ℹ️  Categories Conserved: ${catCount}`);

        console.log('✨ Database Successfully Reset! Ready for clean testing.');
        process.exit(0);

    } catch (error) {
        console.error(`❌ Reset Error: ${error.message}`);
        process.exit(1);
    }
};

resetDB();
