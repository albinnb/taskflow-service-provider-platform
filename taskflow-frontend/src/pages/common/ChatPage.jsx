import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { chatApi } from '../../api/serviceApi';
import { AuthContext } from '../../context/AuthContext';
import ChatWindow from '../../components/chat/ChatWindow';

const ChatPage = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.state?.selectedChatId) {
            setSelectedChatId(location.state.selectedChatId);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await chatApi.getChats();
                setChats(res.data);
            } catch (err) {
                console.error('Error fetching chats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, [user]);

    const handleChatRead = (chatId) => {
        setChats(prevChats => prevChats.map(chat => {
            if (chat._id === chatId) {
                return { ...chat, unreadCount: 0 };
            }
            return chat;
        }));
    };

    if (loading) return <div className="p-10 text-center">Loading chats...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">My Messages</h1>
            <div className="flex flex-col md:flex-row gap-6 h-[600px]">
                {/* Chat List Sidebar */}
                <div className={`w-full md:w-1/3 bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-border bg-muted/50 font-semibold text-foreground">Conversations</div>
                    <div className="overflow-y-auto flex-1 bg-card">
                        {chats.length === 0 ? (
                            <p className="p-4 text-gray-500 text-center">No conversations yet.</p>
                        ) : (
                            chats.map((chat) => {
                                // Find the participant that is NOT me, handling deleted users (null)
                                const otherUser = chat.participants.find((p) => p && p._id !== user._id) || { name: 'Deleted User' };
                                const isSelected = selectedChatId === chat._id;

                                return (
                                    <div
                                        key={chat._id}
                                        onClick={() => setSelectedChatId(chat._id)}
                                        className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${isSelected ? 'bg-accent border-l-4 border-l-primary' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground truncate max-w-[120px]">{otherUser.name}</h3>
                                                {chat.unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            {chat.lastMessage && (
                                                <span className="text-xs text-gray-500">
                                                    {new Date(chat.updatedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {chat.lastMessage ? 'Message...' : 'Start a conversation'}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Window Area */}
                <div className={`w-full md:w-2/3 ${!selectedChatId ? 'hidden md:block' : 'block'}`}>
                    {selectedChatId ? (
                        <>
                            <div className="md:hidden flex items-center p-4 border-b border-border bg-card sticky top-0 z-10">
                                <button
                                    onClick={() => setSelectedChatId(null)}
                                    className="mr-3 p-2 -ml-2 rounded-full hover:bg-secondary text-primary transition-colors"
                                >
                                    <FaArrowLeft />
                                </button>
                                <span className="font-semibold text-lg">Conversation</span>
                            </div>
                            <ChatWindow
                                chatId={selectedChatId}
                                key={selectedChatId}
                                onChatRead={() => handleChatRead(selectedChatId)}
                            />
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center border border-border rounded-lg bg-card text-muted-foreground">
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
