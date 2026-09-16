import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create the SocketContext
const SocketContext = createContext(null);

/**
 * SocketProvider Component
 * Manages the lifetime of the Socket.io connection and tracks global online user states.
 */
export const SocketProvider = ({ children }) => {
  const { user } = useAuth(); // Retrieve active login state
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Connect to the socket server only if the user is authenticated (has a token)
    if (user && user.token) {
      console.log('[SocketContext] User logged in. Connecting socket...');

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const newSocket = io(backendUrl, {
        auth: { token: user.token }
      });

      setSocket(newSocket);

      // Listen to the online users list emitted by the server
      const handleOnlineList = (usersList) => {
        console.log('[SocketContext] Online users list updated:', usersList);
        setOnlineUsers(usersList);
      };

      // Handle socket connection authentication errors (e.g. token expired)
      const handleConnectError = (err) => {
        console.warn('[SocketContext] Connection error:', err.message);
        if (err.message && (err.message.includes('Authentication error') || err.message.includes('jwt expired'))) {
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      };

      newSocket.on('onlineUsersList', handleOnlineList);
      newSocket.on('connect_error', handleConnectError);

      // Clean up the connection on logout or when the user changes
      return () => {
        console.log('[SocketContext] Disconnecting socket...');
        newSocket.off('onlineUsersList', handleOnlineList);
        newSocket.off('connect_error', handleConnectError);
        newSocket.disconnect();
      };
    } else {
      // If user is logged out, clear states
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [user]);

  // Expose the socket connection instance and online users list
  const value = {
    socket,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Custom hook to easily consume the SocketContext in any functional component.
 * Allows components to grab the socket instance and online users list:
 * const { socket, onlineUsers } = useSocket();
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
