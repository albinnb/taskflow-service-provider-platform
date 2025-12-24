import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get all chats for current user
// @route   GET /api/chats
// @access  Private
export const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user._id })
            .populate('participants', 'name email role')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .lean(); // Use lean() to allow adding properties

        // Calculate unread count for each chat
        const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
            const unreadCount = await Message.countDocuments({
                chatId: chat._id,
                sender: { $ne: req.user._id }, // Sender is NOT me
                readBy: { $ne: req.user._id }  // I have NOT read it
            });
            return { ...chat, unreadCount };
        }));

        res.json(chatsWithUnread);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a specific chat
// @route   GET /api/chats/:chatId
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatId })
            .populate('sender', 'name email')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create or return existing chat with a user
// @route   POST /api/chats
// @access  Private
export const createChat = async (req, res) => {
    const { targetUserId } = req.body;

    if (!targetUserId) {
        return res.status(400).json({ message: 'Target user ID is required' });
    }

    try {
        // Check if chat exists
        let chat = await Chat.findOne({
            participants: { $all: [req.user._id, targetUserId] },
        }).populate('participants', 'name email role');

        if (chat) {
            return res.json(chat);
        }

        // Create new chat
        const newChat = await Chat.create({
            participants: [req.user._id, targetUserId],
        });

        const fullChat = await Chat.findById(newChat._id).populate('participants', 'name email role');
        res.status(201).json(fullChat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all messages in a chat as read
// @route   PUT /api/chats/:chatId/read
// @access  Private
export const markChatRead = async (req, res) => {
    try {
        await Message.updateMany(
            {
                chatId: req.params.chatId,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id }
            },
            {
                $addToSet: { readBy: req.user._id }
            }
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}
