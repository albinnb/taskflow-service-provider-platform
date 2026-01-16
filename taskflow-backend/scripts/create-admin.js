import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths for dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected to DB');

        const adminData = {
            name: 'Admin User',
            email: 'admin@gmail.com',
            passwordHash: 'password123', // Will be hashed by pre-save hook
            role: 'admin',
            address: {
                house_name: 'Admin HQ',
                street_address: 'Central Ave',
                city_district: 'New Delhi',
                state: 'Delhi',
                pincode: '110001'
            },
            location: {
                type: 'Point',
                coordinates: [77.2090, 28.6139],
                formattedAddress: 'Central Ave, New Delhi, Delhi, India'
            }
        };

        // Check if admin already exists
        const exists = await User.findOne({ email: adminData.email });
        if (exists) {
            console.log('⚠️  Admin already exists.');
            process.exit(0);
        }

        await User.create(adminData);
        console.log('✅ Admin User Created Successfully!');
        console.log('📧 Email: admin@gmail.com');
        console.log('🔑 Password: password123');

        process.exit(0);

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

createAdmin();
