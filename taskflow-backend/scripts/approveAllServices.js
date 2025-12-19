import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../src/models/Service.js';

dotenv.config();

const approveAllServices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const result = await Service.updateMany(
            {},
            { $set: { approvalStatus: 'approved' } }
        );

        console.log(`Updated ${result.modifiedCount} services to 'approved' status.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

approveAllServices();
