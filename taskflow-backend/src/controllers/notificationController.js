import asyncHandler from '../utils/asyncHandler.js';
import Notification from '../models/Notification.js';

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: notifications.length,
        data: notifications,
    });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    // Ensure ownership
    if (notification.recipient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
});

// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete ALL notifications for current user
// @route   DELETE /api/notifications
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ recipient: req.user._id });

    res.json({ success: true, message: 'All notifications deleted' });
});

export { getUserNotifications, markNotificationRead, markAllRead, deleteAllNotifications };
