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
    },
    // --- Address Fields (Standardized for Location) ---
    address: {
      // House name/number/flat number
      house_name: { 
            type: String,
            trim: true,
        },
      // Street, Locality, or Village
      street_address: {
            type: String,
            trim: true,
        },
      // City or District
      city_district: { 
            type: String,
            trim: true,
        },
      // State (e.g., Kerala)
      state: {
            type: String,
            trim: true,
        },
      // 6-digit Pincode (kept as string for flexibility)
      pincode: {
            type: String, 
            trim: true,
        },
    },
    // ------------------------------------------------------------------
    // GEO-SEARCH REMOVAL: The entire 'location' field is removed.
    // ------------------------------------------------------------------
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
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