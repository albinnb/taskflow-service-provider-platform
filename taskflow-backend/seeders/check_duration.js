import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../src/models/Service.js';

dotenv.config();

const checkDuration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const services = await Service.find({ durationMinutes: 47 });

        if (services.length > 0) {
            console.log("✅ Found services with 47 minutes duration:");
            services.forEach(s => console.log(`- ${s.title} (ID: ${s._id})`));
        } else {
            console.log("❌ No services found with durationMinutes = 47.");

            // Check surrounding values just in case
            const nearby = await Service.find({ durationMinutes: { $gt: 40, $lt: 55 } });
            console.log("\nServices with duration between 40-55 mins:");
            nearby.forEach(s => console.log(`- ${s.title}: ${s.durationMinutes} mins`));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkDuration();
