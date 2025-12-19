import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../src/models/Service.js';

dotenv.config();

const inspectService = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Find the most recent service or specifically 'Car Cleaning'
        const service = await Service.findOne({ title: /Car Cleaning/i });

        if (service) {
            console.log('--- INSPECTED SERVICE ---');
            console.log('ID:', service._id);
            console.log('Title:', service.title);
            console.log('Status:', service.approvalStatus);
            console.log('IsActive:', service.isActive);
            console.log('-------------------------');
        } else {
            console.log('Service "Car Cleaning" not found.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspectService();
