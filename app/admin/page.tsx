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

function SkeletonCard() {
  return (
    <div className="bg-gray-50 border border-gray-100 p-6 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
      <div className="h-2 w-24 bg-gray-100 rounded" />
    </div>
  );
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-black">
            Dashboard
          </h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            Cargando estadisticas...
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Error al cargar estadisticas
        </p>
      </div>
    );
  }

  const metricCards = [
    {
      label: "USUARIOS",
      value: stats.totals.users,
      sub: `+${stats.today.users} hoy`,
      trend: stats.today.users > 0,
      href: "/admin/users",
    },
    {
      label: "POSTS",
      value: stats.totals.posts,
      sub: `+${stats.today.posts} hoy`,
      trend: stats.today.posts > 0,
      href: "/admin/posts",
    },
    {
      label: "ORDENES",
      value: stats.totals.likes,
      sub: `${stats.totals.comments} comentarios`,
      trend: true,
      href: "/admin/orders",
    },
    {
      label: "PRODUCTOS",
      value: stats.totals.garments,
      sub: `${stats.totals.brands} marcas`,
      trend: stats.totals.garments > 0,
      href: "/admin/brands",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-black">
          Dashboard
        </h1>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
          Vision general de la plataforma
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-gray-100 p-6 hover:border-purple-200 transition-colors group"
          >
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
              {card.label}
            </p>
            <p className="text-3xl font-black text-black mt-2 group-hover:text-purple-700 transition-colors">
              {card.value.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-[10px] font-black ${
                  card.trend ? "text-green-600" : "text-red-500"
                }`}
              >
                {card.trend ? "↑" : "↓"}
              </span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                {card.sub}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* This Week Summary */}
      <div className="bg-black text-white p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-6">
          ESTA SEMANA
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-2xl font-black">{stats.thisWeek.users}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
              Nuevos Usuarios
            </p>
          </div>
          <div>
            <p className="text-2xl font-black">{stats.thisWeek.posts}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
              Nuevos Posts
            </p>
          </div>
          <div>
            <p className="text-2xl font-black">{stats.totals.likes}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
              Total Likes
            </p>
          </div>
          <div>
            <p className="text-2xl font-black">{stats.totals.notifications}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
              Notificaciones
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">
              USUARIOS RECIENTES
            </p>
            <Link
              href="/admin/users"
              className="text-[9px] font-black uppercase tracking-widest text-purple-700 hover:text-purple-800"
            >
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-6 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-300 flex-shrink-0 overflow-hidden">
                  {user.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePhoto}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[9px] text-gray-400">@{user.username}</p>
                </div>
                <p className="text-[9px] text-gray-300 flex-shrink-0">
                  {formatTimeAgo(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">
              POSTS RECIENTES
            </p>
            <Link
              href="/admin/posts"
              className="text-[9px] font-black uppercase tracking-widest text-purple-700 hover:text-purple-800"
            >
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 px-6 py-3">
                <div className="w-8 h-8 bg-gray-100 flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black truncate">
                    @{post.user.username}
                  </p>
                  <p className="text-[9px] text-gray-400 truncate">
                    {post.caption || "Sin caption"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] text-gray-400">
                    {post._count.likes} likes
                  </p>
                  <p className="text-[8px] text-gray-300">
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
