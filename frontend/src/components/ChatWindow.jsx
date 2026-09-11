import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Send, ArrowLeft, MessageSquare, Compass, Trash2 } from 'lucide-react';

/**
 * ChatWindow Component
 * Renders the chat session room between the logged-in user and the selected partner.
 */
const ChatWindow = ({ selectedUser, messages, onSendMessage, currentUser, onBack, socket, isTypingPartner, onClearChat }) => {
  const [text, setText] = useState('');
  const [isTypingSelf, setIsTypingSelf] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Reference pointing to the empty div at the bottom of our messages log container
  const messagesEndRef = useRef(null);

  // Clear typing timeouts when switching chat partners or when the window unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTypingSelf(false);
    };
  }, [selectedUser]);

  /**
   * Automatically scroll to the bottom of the chat window whenever
   * a new message is loaded or the selected conversation partner changes.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  // Handle message sending form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Trigger parent callback to send message
    onSendMessage(text);

    // Stop typing indicator immediately when message is sent
    if (socket && isTypingSelf) {
      socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
      setIsTypingSelf(false);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Clear text input
    setText('');
  };

  // Handle keystrokes to trigger the typing event
  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (!socket) return;

    // If we were not previously typing, inform the server
    if (!isTypingSelf) {
      setIsTypingSelf(true);
      socket.emit('typing', { receiverId: selectedUser._id, isTyping: true });
    }

    // Debounce the stop typing notification
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
      setIsTypingSelf(false);
    }, 2000); // Stop indicating typing after 2 seconds of inactivity
  };

  /**
   * Helper utility to calculate deterministic avatar color (matches Sidebar palette)
   */
  const getAvatarColor = (name) => {
    const colors = [
      'bg-indigo-600', 'bg-emerald-600', 'bg-teal-600', 'bg-blue-600',
      'bg-purple-600', 'bg-pink-600', 'bg-orange-600', 'bg-rose-600', 'bg-violet-600'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // State A: No conversation selected yet
  if (!selectedUser) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center select-none">
        <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
          <Compass size={42} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">ChatSphere</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Select a user from the sidebar directory to load chat logs and start messaging in real-time.
        </p>
      </div>
    );
  }

  // State B: Chatting with a selected user
  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950">
      
      {/* 1. Header: Chat Partner Info */}
      <div className="flex items-center gap-3.5 px-4 py-3 bg-slate-900 border-b border-slate-800 shadow-md">
        
        {/* Back Button (Visible ONLY on mobile devices) */}
        <button
          onClick={onBack}
          className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
        >
          <ArrowLeft size={16} />
        </button>

        {/* User Initials Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${getAvatarColor(selectedUser.username)}`}>
          {selectedUser.username.charAt(0).toUpperCase()}
        </div>

        {/* Username & Subtitle */}
        <div className="text-left flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white truncate max-w-[180px] md:max-w-xs">
            {selectedUser.username}
          </h2>
          {isTypingPartner ? (
            <p className="text-[10px] text-indigo-400 font-semibold animate-pulse">typing...</p>
          ) : (
            <p className="text-[10px] text-slate-500 truncate">{selectedUser.email}</p>
          )}
        </div>

        {/* Clear Chat Trash Button */}
        {onClearChat && (
          <button
            onClick={() => {
              if (window.confirm(`Clear all chat history with ${selectedUser.username}?`)) {
                onClearChat();
              }
            }}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-red-400 bg-slate-950/60 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 rounded-xl transition-all duration-200"
          >
            <Trash2 size={16} />
          </button>
        )}

      </div>

      {/* 2. Scrollable Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/40 space-y-2">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble key={msg._id} message={msg} currentUser={currentUser} />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 select-none">
            <MessageSquare size={36} className="mb-2 opacity-30" />
            <p className="text-sm font-medium">Say hello to {selectedUser.username}!</p>
            <p className="text-xs text-slate-700 mt-1">No messages recorded in history.</p>
          </div>
        )}
        
        {/* Empty anchor element used to trigger auto-scroll-to-bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Footer: Message Text Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 shadow-lg">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder={`Type a message to ${selectedUser.username}...`}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl active:scale-95 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatWindow;
