"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Search,
  UserCircle,
} from "lucide-react";

import {
  getCurrentUserFromToken,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  Notification,
} from "@/lib/api";

function formatNotificationTime(date: string) {
  const elapsed = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export default function Header() {
  const [role, setRole] = useState("Unknown");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    let mounted = true;

    const roleUpdate = window.setTimeout(() => {
      if (mounted) {
        setRole(getCurrentUserFromToken()?.role ?? "Unknown");
      }
    }, 0);

    async function loadNotifications() {
      try {
        const data = await getNotifications();
        if (mounted) setNotifications(data);
      } catch {
        // The header should remain usable if notifications are unavailable.
      }
    }

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      window.clearTimeout(roleUpdate);
      window.clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  async function handleRead(notification: Notification) {
    if (notification.is_read) return;

    try {
      const updated = await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) => item.id === updated.id ? updated : item)
      );
    } catch {
      // Keep the notification visible if the update fails.
    }
  }

  async function handleReadAll() {
    if (!unreadCount) return;

    setLoadingNotifications(true);
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true }))
      );
    } catch {
      // Keep the unread state if the update fails.
    } finally {
      setLoadingNotifications(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6">

      {/* Search */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative rounded-xl p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-30 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {unreadCount ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!unreadCount || loadingNotifications}
                  onClick={handleReadAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  Mark all read
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Bell className="mx-auto h-7 w-7 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-700">No notifications yet</p>
                  <p className="mt-1 text-xs text-gray-500">Updates about your tickets will appear here.</p>
                </div>
              ) : (
                <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => handleRead(notification)}
                      className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${notification.is_read ? "" : "bg-blue-50/50"}`}
                    >
                      <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${notification.is_read ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"}`}>
                        {notification.is_read ? <Check className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900">{notification.title}</span>
                          {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-gray-600">{notification.message}</span>
                        <span className="mt-1 block text-[11px] text-gray-400">{formatNotificationTime(notification.created_at)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          <UserCircle
            size={34}
            className="text-gray-400"
          />

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">
              Role: {role}
            </p>

            <p className="text-xs text-gray-500">
              Support User
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}