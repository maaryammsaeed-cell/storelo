'use client';

import { useState } from 'react';

// Demo Notifications Data
const initialNotifications = [
  {
    id: 1,
    type: 'order',
    title: 'New Order Received',
    message: 'Order #ST-1082 placed by Sara Khan for RS 4,500.',
    time: '5 mins ago',
    read: false,
  },
  {
    id: 2,
    type: 'customer',
    title: 'New Customer Registered',
    message: 'Ali Ahmed created a new account.',
    time: '30 mins ago',
    read: false,
  },
  {
    id: 3,
    type: 'stock',
    title: 'Low Stock Alert',
    message: 'Product "Cream Oversized Tee" has only 2 items left in stock.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 4,
    type: 'order',
    title: 'Order Delivered',
    message: 'Order #ST-1079 was successfully delivered.',
    time: '1 day ago',
    read: true,
  },
  {
    id: 5,
    type: 'customer',
    title: 'Profile Updated',
    message: 'Zainab Malik updated her shipping address.',
    time: '2 days ago',
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'order', 'stock'

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark single as read
  const markAsRead = (id) => {
    setNotifications(
      notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((item) => ({ ...item, read: true }))
    );
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Filter logic
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'order') return notif.type === 'order';
    if (filter === 'stock') return notif.type === 'stock';
    return true;
  });

  // Emoji icon selector
  const getEmojiIcon = (type) => {
    switch (type) {
      case 'order':
        return '🛍️';
      case 'customer':
        return '👤';
      case 'stock':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto font-sans">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white/60 p-6 rounded-2xl border border-pink-100 shadow-sm backdrop-blur-sm">
        <div>
          <span className="text-xs font-bold tracking-wider text-pink-600 uppercase bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
            Store Activity & Center
          </span>
          <h1 className="text-3xl md:text-4xl font-serif text-pink-950 font-bold mt-2 flex items-center gap-3 flex-wrap">
            Notifications 
            {unreadCount > 0 && (
              <span className="bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-sans font-medium shadow-sm">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-sm text-pink-900/70 mt-1 max-w-xl">
            Monitor real-time store activity, track new customer registrations, incoming orders, and inventory status seamlessly.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              ✓ Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all border border-stone-200 flex items-center gap-2"
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {[
          { id: 'all', label: 'All Notifications', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'order').length },
          { id: 'stock', label: 'Stock Alerts', count: notifications.filter(n => n.type === 'stock').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 border ${
              filter === tab.id
                ? 'bg-pink-950 text-white border-pink-950 shadow-sm'
                : 'bg-white/80 text-pink-950/80 border-pink-100 hover:bg-pink-50'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab.id ? 'bg-pink-800 text-white' : 'bg-pink-100 text-pink-800'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List Container */}
      <div className="space-y-3.5">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/50 border border-pink-100 rounded-2xl p-16 text-center shadow-sm">
            <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
              ✨
            </div>
            <h3 className="text-xl font-serif font-bold text-pink-950">
              No Notifications Found
            </h3>
            <p className="text-sm text-pink-900/60 mt-1 max-w-sm mx-auto">
              There are no updates matching your current filter. You are fully up to date!
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-2xl border transition-all gap-4 ${
                notif.read
                  ? 'bg-amber-50/20 border-pink-100/60 opacity-85 hover:opacity-100'
                  : 'bg-white border-pink-200 shadow-md shadow-pink-950/5'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                    notif.read
                      ? 'bg-stone-50 border-stone-200'
                      : 'bg-pink-50 border-pink-200 shadow-sm'
                  }`}
                >
                  {getEmojiIcon(notif.type)}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className={`text-sm font-bold ${notif.read ? 'text-stone-700' : 'text-pink-950'}`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-100 text-pink-700 border border-pink-200">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[11px] text-pink-900/50 mt-1.5 block font-medium">
                    🕒 {notif.time}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="self-end sm:self-center text-xs font-semibold text-pink-700 hover:text-white bg-pink-50 hover:bg-pink-600 px-3.5 py-2 rounded-xl transition-all border border-pink-200 whitespace-nowrap"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}