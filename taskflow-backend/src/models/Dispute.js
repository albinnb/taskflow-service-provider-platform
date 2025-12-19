import mongoose from 'mongoose';

const disputeSchema = mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Booking',
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Provider'
        },
        reason: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        status: {
            type: String,
            enum: ['open', 'resolved', 'refunded', 'rejected'],
            default: 'open',
        },
        adminNotes: {
            type: String,
            maxlength: 1000,
        },
        resolutionDate: {
            type: Date
        }
    },
    {
        timestamps: true,
    }
);

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
