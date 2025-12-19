import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Provider from '../src/models/Provider.js';

dotenv.config();

const verifyLocations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for Verification');

        const usersWithLocation = await User.countDocuments({ 'location.coordinates': { $exists: true } });
        const providersWithLocation = await Provider.countDocuments({ 'location.coordinates': { $exists: true } });

        console.log(`Users with Location: ${usersWithLocation}`);
        console.log(`Providers with Location: ${providersWithLocation}`);

        if (usersWithLocation > 0 && providersWithLocation > 0) {
            console.log("✅ Verification SUCCESS: Locations found.");
        } else {
            console.log("❌ Verification FAILED: No locations found.");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Verification Error:", error);
        process.exit(1);
    }
};

verifyLocations();
