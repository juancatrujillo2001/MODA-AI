"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { formatTimeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  type: "LIKE" | "FOLLOW" | "COMMENT" | "BRAND_PRODUCT" | "TREND";
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; link?: string }
> = {
  LIKE: { icon: "♥", color: "text-red-500" },
  FOLLOW: { icon: "👤", color: "text-brand-500" },
  COMMENT: { icon: "💬", color: "text-blue-500" },
  BRAND_PRODUCT: { icon: "🏷️", color: "text-green-500" },
  TREND: { icon: "🔥", color: "text-orange-500" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function markAllRead() {
    const res = await fetch("/api/notifications/read", { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  // Extract username from message like "username liked your post"
  function extractUsername(message: string): string | null {
    const match = message.match(/^(\S+)\s/);
    return match ? match[1] : null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopHeader />

      <main className="max-w-screen-md mx-auto">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-brand-500"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">
              When someone likes, comments, or follows you, it&apos;ll show up
              here
            </p>
          </div>
        ) : (
          <div>
            {/* Unread section */}
            {notifications.some((n) => !n.read) && (
              <div>
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                  New
                </p>
                {notifications
                  .filter((n) => !n.read)
                  .map((n) => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.LIKE;
                    const username = extractUsername(n.message);
                    return (
                      <button
                        key={n.id}
                        onClick={() => markOneRead(n.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 bg-brand-50/50 hover:bg-brand-50 border-b border-gray-100 text-left"
                      >
                        <span className={`text-lg ${config.color}`}>
                          {config.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            {username ? (
                              <>
                                <Link
                                  href={`/profile/${username}`}
                                  className="font-semibold hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {username}
                                </Link>
                                {n.message.slice(username.length)}
                              </>
                            ) : (
                              n.message
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Read section */}
            {notifications.some((n) => n.read) && (
              <div>
                {notifications.some((n) => !n.read) && (
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                    Earlier
                  </p>
                )}
                {notifications
                  .filter((n) => n.read)
                  .map((n) => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.LIKE;
                    const username = extractUsername(n.message);
                    return (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 border-b border-gray-100"
                      >
                        <span className={`text-lg ${config.color} opacity-60`}>
                          {config.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600">
                            {username ? (
                              <>
                                <Link
                                  href={`/profile/${username}`}
                                  className="font-semibold hover:underline"
                                >
                                  {username}
                                </Link>
                                {n.message.slice(username.length)}
                              </>
                            ) : (
                              n.message
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
