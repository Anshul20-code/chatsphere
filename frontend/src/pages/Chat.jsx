import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { Loader2 } from 'lucide-react';

/**
 * Chat Page Component
 * Main page for the chat interface. Handles side-by-side components, 
 * fetches registered users list, loads message history, and handles responsive layout actions.
 */
const Chat = () => {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();

  // App states
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  // UX states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  /**
   * Fetch all registered users on initial component mount.
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError('');
        
        // GET all registered users from backend API
        const response = await API.get('/api/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users list. Please try again later.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  /**
   * Fetch chat history with a specific user from backend.
   * Runs whenever the selectedUser changes.
   */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        setLoadingMessages(true);
        // GET message logs between logged-in user and selected partner
        const response = await API.get(`/api/messages/${selectedUser._id}`);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to load message logs:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // Set up socket listener for typing updates
  useEffect(() => {
    if (!socket) return;

    // Listen to typing updates from partners
    const handleTypingStatus = (data) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.senderId]: data.isTyping
      }));
    };

    socket.on('typingStatus', handleTypingStatus);

    return () => {
      socket.off('typingStatus', handleTypingStatus);
    };
  }, [socket]);

  // Set up message socket receiver. Reloaded on selectedUser changes
  // to avoid stale selections inside callback closure.
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const senderId = message.sender._id || message.sender;
      const receiverId = message.receiver._id || message.receiver;

      if (selectedUser) {
        const isFromSelected = senderId === selectedUser._id;
        const isToSelected = receiverId === selectedUser._id;

        if (isFromSelected || isToSelected) {
          setMessages((prev) => [...prev, message]);
          return; // Skip counting as unread if the active chat window is already open
        }
      }

      // If conversation is NOT open, and we are the receiver of the message,
      // increment the unread count for the sender of the message.
      if (receiverId === user._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, selectedUser]);

  /**
   * Handler for selecting a user from the sidebar
   */
  const handleSelectUser = (userItem) => {
    setSelectedUser(userItem);
    // Reset unread message count for the selected user to 0
    setUnreadCounts((prev) => ({
      ...prev,
      [userItem._id]: 0
    }));
  };

  /**
   * Handler for sending a new message via Socket.io.
   * Server saves it to MongoDB and broadcasts it back via 'receiveMessage'
   */
  const handleSendMessage = (messageText) => {
    if (!selectedUser || !socket) return;

    // Emit the message details
    socket.emit('sendMessage', {
      receiverId: selectedUser._id,
      messageText: messageText
    });
  };

  return (
    <div className="w-full h-screen flex bg-slate-950 text-white overflow-hidden">
      
      {/* 
        1. LEFT SIDEBAR PANEL (~30% width)
        On mobile: Hidden if a user is currently selected (so that the chat window takes up full screen).
        On desktop: Always visible.
      */}
      <div 
        className={`w-full md:w-[30%] h-full flex-col min-w-[280px] max-w-full md:max-w-[360px] ${
          selectedUser ? 'hidden md:flex' : 'flex'
        }`}
      >
        {loadingUsers ? (
          <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-900 border-r border-slate-800 text-slate-500">
            <Loader2 className="animate-spin mb-2" size={28} />
            <p className="text-sm font-medium">Loading directories...</p>
          </div>
        ) : error ? (
          <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-900 border-r border-slate-800 px-4 text-center text-slate-400">
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <Sidebar
            users={users}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            onLogout={logout}
            currentUser={user}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            unreadCounts={unreadCounts}
          />
        )}
      </div>

      {/* 
        2. RIGHT CHAT WINDOW PANEL (~70% width)
        On mobile: Visible only when a user is selected.
        On desktop: Always visible (displays placeholder if selectedUser is null).
      */}
      <div 
        className={`w-full md:w-[70%] h-full flex-col ${
          selectedUser ? 'flex' : 'hidden md:flex'
        }`}
      >
        {loadingMessages ? (
          <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm font-medium">Retrieving chat logs...</p>
          </div>
        ) : (
          <ChatWindow
            selectedUser={selectedUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={user}
            onBack={() => setSelectedUser(null)} // Click to go back to sidebar list on mobile
            socket={socket}
            isTypingPartner={!!typingUsers[selectedUser?._id]}
          />
        )}
      </div>

    </div>
  );
};

export default Chat;
