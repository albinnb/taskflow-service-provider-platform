import mongoose from 'mongoose';

/**
 * @desc Availability Time Range Sub-Schema
 */
const availabilitySlotSchema = mongoose.Schema({
    from: { type: String, required: true }, // e.g., "09:00" (24hr format)
    to: { type: String, required: true },   // e.g., "17:00"
}, { _id: false });

/**
 * @desc Daily Availability Schema (FIXED: REMOVED unique: true)
 */
const dailyAvailabilitySchema = mongoose.Schema({
    dayOfWeek: {
        type: Number, // 0=Sunday, 1=Monday, ..., 6=Saturday
        required: true,
        min: 0,
        max: 6,
        // FIX: Removed 'unique: true' constraint to prevent E11000 index crash during seeding.
    },
    slots: [availabilitySlotSchema], // Array of time range slots for that day
}, { _id: false });


/**
 * @desc Provider Profile Schema (linked 1:1 with a User where role='provider')
 */
const providerSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Reference to the base User document
            unique: true,
        },
        businessName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            maxlength: 500,
        },
        categories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category', // Categories the provider operates in
            },
        ],
        services: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Service', // List of services offered by this provider
            },
        ],
        images: [
            {
                url: String, // URL of the image (e.g., Cloudinary)
                public_id: String, // Public ID for deletion (if using Cloudinary)
            },
        ],
        address: {
            house_name: { type: String, trim: true },
            street_address: { type: String, trim: true },
            city_district: { type: String, trim: true },
            state: { type: String, trim: true },
            pincode: { type: String, trim: true },
        },
        
        isVerified: {
            type: Boolean,
            default: false, // Set to true by admin after review
        },
        availability: [dailyAvailabilitySchema], 
        
        ratingAvg: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

const Provider = mongoose.model('Provider', providerSchema);

export default Provider;