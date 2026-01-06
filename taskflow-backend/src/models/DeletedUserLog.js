import mongoose from 'mongoose';

const deletedUserLogSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        deletedAt: {
            type: Date,
            default: Date.now,
        },
        reason: {
            type: String,
            default: 'Admin action',
        }
    },
    {
        timestamps: true,
    }
);

// Index for fast lookup by email
deletedUserLogSchema.index({ email: 1 });

const DeletedUserLog = mongoose.model('DeletedUserLog', deletedUserLogSchema);

export default DeletedUserLog;
