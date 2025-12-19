import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Availability Sub-Schemas
// ---------------------------------------------------------------------------

const availabilitySlotSchema = new mongoose.Schema(
  {
    // 24h format, e.g. "09:00", "17:30"
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const dayAvailabilitySchema = new mongoose.Schema(
  {
    // e.g. "Monday", "Tuesday", ...
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    // If isAvailable is true, provider can define one or more time ranges
    slots: {
      type: [availabilitySlotSchema],
      default: [],
    },
  },
  { _id: false }
);

/**
 * @desc Provider Profile Schema (linked 1:1 with a User where role='provider')
 */
const providerSchema = new mongoose.Schema(
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

    // --- GeoJSON Location ---
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
        default: [0, 0],
      },
      formattedAddress: String,
    },

    isVerified: {
      type: Boolean,
      default: false, // Set to true by admin after review
    },

    // New availability object for schedule engine
    availability: {
      days: {
        type: [dayAvailabilitySchema],
        default: [],
      },
      // Minutes between consecutive bookings (e.g. 15, 30)
      bufferTime: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Provider = mongoose.model('Provider', providerSchema);

export default Provider;