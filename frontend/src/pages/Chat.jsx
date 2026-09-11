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
  const [lastMessages, setLastMessages] = useState({});

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

        // Set the latest message preview for selected user
        if (response.data.length > 0) {
          const lastMsg = response.data[response.data.length - 1];
          const senderId = lastMsg.sender._id || lastMsg.sender;
          setLastMessages((prev) => ({
            ...prev,
            [selectedUser._id]: {
              messageText: lastMsg.messageText,
              createdAt: lastMsg.createdAt,
              sender: senderId
            }
          }));
        }
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

  // Helper utility to safely convert any ID object or string to a plain string
  const toStr = (id) => String(id?._id || id || '');

  // Set up message socket receiver. Reloaded on selectedUser changes
  // to avoid stale selections inside callback closure.
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const senderId = toStr(message.sender);
      const receiverId = toStr(message.receiver);
      const currentUserId = toStr(user._id);
      const selectedId = toStr(selectedUser?._id);

      // Determine who the other chat partner is in this message transaction
      const partnerId = senderId === currentUserId ? receiverId : senderId;

      // 1. Update last message preview and timestamp for sidebar sorting
      setLastMessages((prev) => ({
        ...prev,
        [partnerId]: {
          messageText: message.messageText,
          createdAt: message.createdAt || new Date().toISOString(),
          sender: senderId
        }
      }));

      // 2. Check if this message belongs to the currently open chat conversation
      if (selectedId && (senderId === selectedId || receiverId === selectedId)) {
        setMessages((prev) => [...prev, message]);
        // If current chat is open, do not count as unread
        return;
      }

      // 3. If conversation is NOT open, and we are the receiver, increment unread count for sender
      if (receiverId === currentUserId) {
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
  }, [socket, selectedUser, user._id]);

  /**
   * Handler for selecting a user from the sidebar
   */
  const handleSelectUser = (userItem) => {
    const targetId = toStr(userItem._id);
    setSelectedUser(userItem);

    // Reset unread message count ONLY when user explicitly clicks the conversation
    setUnreadCounts((prev) => ({
      ...prev,
      [targetId]: 0
    }));
  };

  /**
   * Handler for sending a new message via Socket.io.
   * Server saves it to MongoDB and broadcasts it back via 'receiveMessage'
   */
  const handleSendMessage = (messageText) => {
    if (!selectedUser || !socket) return;
    const targetId = toStr(selectedUser._id);
    const currentUserId = toStr(user._id);

    // Update last message preview immediately for current user for instant top sorting
    setLastMessages((prev) => ({
      ...prev,
      [targetId]: {
        messageText: messageText,
        createdAt: new Date().toISOString(),
        sender: currentUserId
      }
    }));

    // Emit the message details
    socket.emit('sendMessage', {
      receiverId: targetId,
      messageText: messageText
    });
  };

  /**
   * Handler for clearing chat history with the selected user
   */
  const handleClearChat = async () => {
    if (!selectedUser) return;
    const targetId = toStr(selectedUser._id);
    try {
      await API.delete(`/api/messages/${targetId}`);
      setMessages([]);
      setLastMessages((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    } catch (err) {
      console.error('Failed to clear chat history:', err);
      alert('Failed to clear chat history.');
    }
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
            lastMessages={lastMessages}
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
            onClearChat={handleClearChat}
          />
        )}
      </div>

    </div>
  );
};

export default Chat;
