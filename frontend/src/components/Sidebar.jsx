import React, { useState } from 'react';
import { LogOut, Search, MessageSquare, User } from 'lucide-react';

/**
 * Sidebar Component
 * Displays the current user profile, search filter, active online indicators, 
 * last message previews, unread badges, and a scrollable list of users sorted by latest activity.
 */
const Sidebar = ({ 
  users, 
  selectedUser, 
  onSelectUser, 
  onLogout, 
  currentUser, 
  onlineUsers = [], 
  typingUsers = {}, 
  unreadCounts = {},
  lastMessages = {} 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Generates a consistent, deterministic background color for user avatars based on their name.
   */
  const getAvatarColor = (name) => {
    const colors = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-teal-600',
      'bg-blue-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-orange-600',
      'bg-rose-600',
      'bg-violet-600'
    ];

    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Format date into readable time (e.g. "10:30 AM")
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

  // Helper utility to safely convert any ID object or string to a plain string
  const toStr = (id) => String(id?._id || id || '');

  // 1. Filter users based on search input
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Sort users by latest message activity (most recent message at the top)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const idA = toStr(a._id);
    const idB = toStr(b._id);
    const timeA = lastMessages[idA]?.createdAt ? new Date(lastMessages[idA].createdAt).getTime() : 0;
    const timeB = lastMessages[idB]?.createdAt ? new Date(lastMessages[idB].createdAt).getTime() : 0;
    return timeB - timeA; // Descending: latest message first
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border-r border-slate-800">
      
      {/* 1. Header Bar: Logged-in User Profile & Logout */}
      <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Deterministic avatar circle for current user with online dot */}
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${getAvatarColor(currentUser?.username)}`}>
              {currentUser?.username?.charAt(0).toUpperCase() || <User size={18} />}
            </div>
            {/* Online Green Dot */}
            <span 
              className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm"
              title="Online"
            />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white truncate max-w-[140px]">
              {currentUser?.username}
            </p>
            <p className="text-[10px] text-emerald-400 font-medium">Online</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 rounded-xl transition-all duration-200"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* 2. Search Box */}
      <div className="p-3 bg-slate-900">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 3. Scrollable List of Active Chat Partners */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/30">
        {sortedUsers.length > 0 ? (
          sortedUsers.map((userItem) => {
            const idStr = toStr(userItem._id);
            const isSelected = toStr(selectedUser?._id) === idStr;
            const isOnline = onlineUsers.some((onlineId) => toStr(onlineId) === idStr);
            const isTyping = typingUsers[idStr];
            const lastMsg = lastMessages[idStr];
            const unreadCount = unreadCounts[idStr] || 0;

            return (
              <div
                key={userItem._id}
                onClick={() => onSelectUser(userItem)}
                className={`flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500 text-white font-medium'
                    : 'hover:bg-slate-800/40 text-slate-300 hover:text-slate-200'
                }`}
              >
                {/* User Initials Avatar with Green Online Status Dot */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-md transition-transform duration-200 ${isSelected ? 'scale-105' : ''} ${getAvatarColor(userItem.username)}`}>
                    {userItem.username.charAt(0).toUpperCase()}
                  </div>
                  {/* Bright Green Dot if user is online */}
                  {isOnline && (
                    <span 
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-md" 
                      title="Online"
                    />
                  )}
                </div>
                
                {/* Username & Last Message / Subtitle */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-semibold truncate text-white">
                      {userItem.username}
                    </h3>
                    {/* Timestamp of last message */}
                    {lastMsg?.createdAt && (
                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    {/* Subtitle: Typing / Last Message / Email */}
                    {isTyping ? (
                      <p className="text-xs text-indigo-400 font-semibold animate-pulse truncate">
                        Typing...
                      </p>
                    ) : lastMsg ? (
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'text-indigo-300 font-medium' : 'text-slate-400'}`}>
                        {toStr(lastMsg.sender) === toStr(currentUser?._id) ? <span className="text-slate-500">You: </span> : null}
                        {lastMsg.messageText}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 truncate">
                        {userItem.email}
                      </p>
                    )}

                    {/* Red unread message count badge */}
                    {unreadCount > 0 && (
                      <span 
                        className="flex items-center justify-center min-w-[18px] h-4 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-md animate-pulse shrink-0 ml-1 select-none"
                        title={`${unreadCount} unread message(s)`}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-500">
            <MessageSquare size={28} className="mb-2 opacity-50" />
            <p className="text-sm">No users found</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Sidebar;
