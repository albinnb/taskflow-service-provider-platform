import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../src/models/Service.js';

dotenv.config();

const resetCarCleaning = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const result = await Service.updateOne(
            { title: /Car Cleaning/i },
            { $set: { approvalStatus: 'pending' } }
        );

        if (result.modifiedCount > 0) {
            console.log('Successfully reset "Car Cleaning" to pending.');
        } else {
            console.log('Service not found or already pending.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetCarCleaning();
