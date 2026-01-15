import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['customer', 'provider', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
    },
    // --- Address Fields (Standardized for Location) ---
    // Note: Kept for backward compatibility and specific address details
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
      formattedAddress: String, // Google's full address string
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// --- Pre-save hook to hash the password before saving ---
userSchema.pre('save', async function (next) {
  // Only hash if the password field has been modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// --- Checks if essential address fields are populated ---
userSchema.methods.isAddressComplete = function () {
  const address = this.address;
  return !!(address.house_name && address.street_address && address.city_district && address.state && address.pincode);
};

const User = mongoose.model('User', userSchema);

export default User;