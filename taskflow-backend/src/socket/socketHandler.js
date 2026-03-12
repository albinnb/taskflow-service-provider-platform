import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const socketHandler = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = await User.findById(decoded.id).select('-passwordHash');
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        logger.info(`User connected: ${socket.user.name} (${socket.user._id})`);

        socket.on('join_room', (chatId) => {
            socket.join(chatId);
            logger.info(`User ${socket.user._id} joined room ${chatId}`);
        });

        socket.on('send_message', async ({ chatId, content }) => {
            try {
                const message = await Message.create({
                    chatId,
                    sender: socket.user._id,
                    content,
                });

                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: message._id,
                    updatedAt: Date.now(),
                });

                // Emit to everyone in the room (including sender)
                // Populate sender details for frontend display
                await message.populate('sender', 'name email');

                io.to(chatId).emit('receive_message', message);
            } catch (error) {
                logger.error(`Error sending message: ${error.message}`);
            }
        });

        socket.on('disconnect', () => {
            logger.info('User disconnected');
        });
    });
};

export default socketHandler;
