import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { chatApi } from '../api/serviceApi';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const { user, isAuthenticated } = useContext(AuthContext);

    const fetchUnreadCount = async () => {
        try {
            if (!isAuthenticated) return;
            const res = await chatApi.getChats();
            const total = res.data.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
            setTotalUnreadCount(total);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchUnreadCount();
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Connect to the backend (same host/port in dev usually, or configured URL)
            const socketInstance = io('http://localhost:5000', {
                auth: {
                    token: localStorage.getItem('locallink-token'), // Matches TOKEN_KEY in AuthContext
                },
                transports: ['websocket'], // Force websocket
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected:', socketInstance.id);
            });

            socketInstance.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            socketInstance.on('receive_message', (message) => {
                // If message is NOT from me, increment
                if (message.sender._id !== user._id) {
                    setTotalUnreadCount(prev => prev + 1);
                }
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [isAuthenticated, user?._id]); // Re-run if user changes (e.g. login/logout)

    return (
        <SocketContext.Provider value={{ socket, totalUnreadCount, fetchUnreadCount }}>
            {children}
        </SocketContext.Provider>
    );
};
