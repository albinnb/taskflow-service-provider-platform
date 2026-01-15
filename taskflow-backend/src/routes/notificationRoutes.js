import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getUserNotifications,
    markNotificationRead,
    markAllRead,
    deleteAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.route('/').get(getUserNotifications);
router.route('/:id/read').put(markNotificationRead);
router.route('/read-all').put(markAllRead);
router.route('/').delete(deleteAllNotifications);

export default router;
