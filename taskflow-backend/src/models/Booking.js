import mongoose from 'mongoose';

/**
 * @desc Booking Status Enum
 */
const bookingStatus = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'];

// --- REMOVED: const timeSlots = [...] ---

/**
 * @desc Booking Schema: A transaction record for a service at a specific time.
 */
const bookingSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Service',
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Provider',
        },
        // ------------------------------------------------------------------
        // REVERT START: Back to specific time and duration
        // ------------------------------------------------------------------
        scheduledAt: {
            type: Date, // The specific start time of the service (TaskRabbit model)
            required: true,
        },
        durationMinutes: {
            type: Number, // The estimated duration the customer selected (TaskRabbit model)
            required: true,
            min: 10,
        },
        // --- REMOVED: bookingDate and timeSlot fields ---
        // ------------------------------------------------------------------
        // REVERT END
        // ------------------------------------------------------------------
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            required: true,
            enum: bookingStatus,
            default: 'pending',
        },
        paymentStatus: {
            type: String, // e.g., 'paid', 'unpaid', 'on-service'
            required: true,
            default: 'unpaid',
        },
        // Metadata for payment gateway or specific booking details
        meta: {
            paymentIntentId: String,
            notes: String, // Essential for TaskRabbit model: Customer's details about the task
            // Optional: provider acceptance/rejection timestamps
        },
    },
    {
        timestamps: true,
    }
);

// --- UPDATED INDEXES ---
// Index on scheduledAt for time-based queries (e.g., provider calendar view)
bookingSchema.index({ scheduledAt: 1 });
// Compound index for user/provider specific booking lists
bookingSchema.index({ userId: 1, providerId: 1, status: 1 });
// NOTE: We rely on the CONTROLLER for complex time overlap checks, not a unique index.


const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;