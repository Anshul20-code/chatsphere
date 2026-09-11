import React from 'react';

/**
 * MessageBubble Component
 * Renders an individual chat bubble with custom styling depending on whether 
 * the message was sent by the current logged-in user or the conversation partner.
 * 
 * @param {object} message - The message object containing text, sender, and timestamp
 * @param {object} currentUser - The currently authenticated user object
 */
const MessageBubble = ({ message, currentUser }) => {
  // Helper utility to safely convert any ID object or string to a plain string
  const toStr = (id) => String(id?._id || id || '');

  // Check if the current logged-in user is the sender of this message
  const senderId = toStr(message.sender);
  const currentUserId = toStr(currentUser?._id || currentUser);
  const isOwnMessage = senderId === currentUserId;

  /**
   * Helper function to format ISO Date string into a human-readable time (e.g. "10:30 AM")
   * @param {string} dateString - ISO Date string
   * @returns {string} Formatted time string
   */
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`flex w-full mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-md transition-all duration-200 ${
          isOwnMessage 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none hover:shadow-indigo-500/10' 
            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50'
        }`}
      >
        {/* Message Content */}
        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
          {message.messageText}
        </p>

        {/* Timestamp */}
        <span 
          className={`text-[10px] mt-1.5 block text-right font-medium select-none ${
            isOwnMessage ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          {formatTime(message.createdAt || message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
