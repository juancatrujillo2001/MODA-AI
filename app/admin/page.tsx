"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

interface Stats {
  totals: {
    users: number;
    posts: number;
    brands: number;
    garments: number;
    likes: number;
    comments: number;
    notifications: number;
  };
  today: { users: number; posts: number };
  thisWeek: { users: number; posts: number };
  recentUsers: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    createdAt: string;
    profilePhoto: string | null;
  }[];
  recentPosts: {
    id: string;
    caption: string | null;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    user: { username: string };
    _count: { likes: number; comments: number };
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Failed to load dashboard stats</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totals.users, sub: `+${stats.today.users} today`, href: "/admin/users", color: "bg-blue-500" },
    { label: "Total Posts", value: stats.totals.posts, sub: `+${stats.today.posts} today`, href: "/admin/posts", color: "bg-green-500" },
    { label: "Brands", value: stats.totals.brands, sub: `${stats.totals.garments} garments`, color: "bg-purple-500" },
    { label: "Likes", value: stats.totals.likes, sub: `${stats.totals.comments} comments`, color: "bg-pink-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const inner = (
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 ${card.color} rounded-lg opacity-20`} />
              </div>
            </div>
          );
          return card.href ? (
            <Link key={card.label} href={card.href}>{inner}</Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      {/* Weekly summary */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="font-semibold mb-3">This Week</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.thisWeek.users}</p>
            <p className="text-xs text-gray-500">New Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.thisWeek.posts}</p>
            <p className="text-xs text-gray-500">New Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-600">{stats.totals.likes}</p>
            <p className="text-xs text-gray-500">Total Likes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.totals.notifications}</p>
            <p className="text-xs text-gray-500">Notifications</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold">Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-brand-500 font-medium hover:text-brand-600">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0 overflow-hidden">
                  {user.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {formatTimeAgo(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent posts */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold">Recent Posts</h3>
            <Link href="/admin/posts" className="text-xs text-brand-500 font-medium hover:text-brand-600">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    @{post.user.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {post.caption || "No caption"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    {post._count.likes} likes &middot; {post._count.comments} comments
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTimeAgo(post.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
