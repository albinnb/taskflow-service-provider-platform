import React, { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { chatApi } from '../../api/serviceApi';

const ChatWindow = ({ chatId, onChatRead }) => {
    const { socket, fetchUnreadCount } = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Load initial messages
        const fetchMessages = async () => {
            try {
                const res = await chatApi.getMessages(chatId);
                setMessages(res.data);
                // Mark as read
                await chatApi.markAsRead(chatId);
                fetchUnreadCount(); // Refresh global count
                if (onChatRead) onChatRead(); // Update parent list UI
            } catch (err) {
                console.error(err);
            }
        };
        if (chatId) fetchMessages();
    }, [chatId]);

    useEffect(() => {
        if (!socket || !chatId) return;

        // Join room
        socket.emit('join_room', chatId);

        // Listen for new messages
        const handleReceiveMessage = async (message) => {
            if (message.chatId === chatId) {
                setMessages((prev) => [...prev, message]);

                // If I'm viewing this chat, mark it as read immediately if it's from someone else
                try {
                    if (message.sender._id !== user._id) {
                        await chatApi.markAsRead(chatId);
                        fetchUnreadCount();
                        if (onChatRead) onChatRead();
                    }
                } catch (e) { }
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            chatId,
            content: newMessage,
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-[500px] border border-border rounded-lg bg-card shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {messages.map((msg) => {
                    const isMyMessage = (msg.sender?._id || msg.sender) === user._id; // Handle populated object or ID safely
                    return (
                        <div key={msg._id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[70%] p-3 rounded-lg ${isMyMessage ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                <span className={`text-[10px] opacity-70 block text-right mt-1 ${isMyMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 bg-card border-t border-border flex gap-2">
                <input
                    type="text"
                    className="flex-1 p-2 border border-input bg-background/50 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
                    disabled={!newMessage.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
