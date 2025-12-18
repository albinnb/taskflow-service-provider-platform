import mongoose from 'mongoose';

/**
 * @desc Service Schema: Specific service offered by a provider.
 */
const serviceSchema = mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Provider',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      text: true, // For full-text search
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
      text: true, // For full-text search
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 10,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    tags: [String], // e.g., ['express', 'premium', 'eco-friendly']
    isActive: {
      type: Boolean,
      default: true,
    },
    // ------------------------------------------------------------------
    // GEO-SEARCH REMOVAL: The entire denormalized 'location' field is removed.
    // ------------------------------------------------------------------
  },
  {
    timestamps: true,
  }
);

// Compound index for full-text search across multiple fields
serviceSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Index on category for filtering
serviceSchema.index({ category: 1 });
// Index on provider for fast provider-specific queries
serviceSchema.index({ providerId: 1 });


const Service = mongoose.model('Service', serviceSchema);

export default Service;