import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getChats, getMessages, createChat, markChatRead } from '../controllers/chatController.js';

const router = express.Router();

router.use(protect);

router.get('/', getChats);
router.post('/', createChat);
router.get('/:chatId', getMessages);
router.put('/:chatId/read', markChatRead);

export default router;
