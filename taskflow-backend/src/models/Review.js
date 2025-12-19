import mongoose from 'mongoose';

/**
 * @desc Review Schema: Feedback from a User about a Provider after a Booking.
 */
const reviewSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Provider',
      index: true, // Index for fast provider review fetching
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Booking',
      unique: true, // A user can only review a booking once
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness (user can only review a booking once)
reviewSchema.index({ userId: 1, bookingId: 1 }, { unique: true });

// --- POST SAVE/DELETE HOOK ---

/**
 * @desc After a review is saved or deleted, update the Provider's average rating.
 * @param {string} doc - The document that was saved or removed.
 * @param {function} next - Middleware function.
 */
const updateProviderRating = async function (doc, next) {
  const Provider = mongoose.model('Provider');

  try {
    // 1. Calculate new average rating and count
    const stats = await doc.constructor.aggregate([
      { $match: { providerId: doc.providerId } },
      {
        $group: {
          _id: '$providerId',
          ratingAvg: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    // 2. Update the Provider document
    const updateData = stats.length > 0
      ? {
        ratingAvg: stats[0].ratingAvg,
        reviewCount: stats[0].reviewCount,
      }
      : { ratingAvg: 0, reviewCount: 0 };

    await Provider.findByIdAndUpdate(doc.providerId, updateData);
    next();
  } catch (error) {
    console.error('Error updating provider rating:', error);
    // In a production app, you might use a dedicated job queue for this
    next();
  }
};

reviewSchema.post('save', async function (doc, next) {
  // Use a setTimeout to de-couple the rating calculation from the main request thread
  setTimeout(() => updateProviderRating.call(this, doc, () => { }), 0);
  next();
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function (doc, next) {
  setTimeout(() => updateProviderRating.call(this, doc, () => { }), 0);
  next();
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;