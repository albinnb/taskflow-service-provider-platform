import mongoose from 'mongoose';

const activityLogSchema = mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        action: {
            type: String,
            required: true,
            // Examples: 'PROVIDER_VERIFIED', 'SERVICE_DELETED', 'USER_BANNED'
        },
        targetId: {
            type: String, // Can be UserID, ServiceID, etc.
            required: false
        },
        details: {
            type: String,
            required: true
        },
        ipAddress: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true
    }
);

activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
