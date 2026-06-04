"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PostDetailModal } from "@/components/profile/post-detail-modal";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { HeartIcon, CommentIcon } from "@/components/icons";

/* ─── Types ──────────────────────────────────────────── */
interface ProfilePost {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  createdAt: string;
  _count?: { likes: number; comments: number };
  likesCount?: number;
  commentsCount?: number;
}

interface ProfileData {
  id: string;
  fullName: string;
  username: string;
  bio: string | null;
  profilePhoto: string | null;
  avatar: string | null;
  height: number | null;
  weight: number | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwner: boolean;
  posts: ProfilePost[];
}

type TabKey = "posts" | "saved" | "twin";

/* ─── Size estimation logic ──────────────────────────── */
function estimateSize(height: number, weight: number): string {
  const bmi = weight / Math.pow(height / 100, 2);
  if (bmi < 19) return "S";
  if (bmi < 26) return "M";
  if (bmi < 32) return "L";
  return "XL";
}

function shoulderMeasure(height: number, weight: number): number {
  return Math.round(38 + (weight - 50) * 0.12 + (height - 160) * 0.06);
}

function waistMeasure(height: number, weight: number): number {
  return Math.round(68 + (weight - 50) * 0.5 + (height - 160) * 0.05);
}

function shoeSize(height: number): number {
  return Math.round(36 + (height - 150) * 0.14);
}

/* ─── Skeleton ───────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-28">
      <TopHeader />
      <div className="h-40 bg-[#111118] animate-pulse" />
      <div className="max-w-[600px] mx-auto px-4">
        <div className="-mt-14 flex items-end justify-between mb-4">
          <div className="w-24 h-24 rounded-full bg-[#1a1a25] animate-pulse ring-4 ring-[#0a0a0f]" />
          <div className="flex gap-2 pb-1">
            <div className="w-28 h-10 bg-[#1a1a25] animate-pulse rounded-xl" />
          </div>
        </div>
        <div className="space-y-3 mt-4">
          <div className="h-5 w-40 bg-[#1a1a25] animate-pulse rounded" />
          <div className="h-3 w-24 bg-[#1a1a25] animate-pulse rounded" />
        </div>
        <div className="flex gap-8 mt-6 py-4 border-t border-b border-white/[0.06]">
          <div className="h-10 w-16 bg-[#1a1a25] animate-pulse rounded" />
          <div className="h-10 w-16 bg-[#1a1a25] animate-pulse rounded" />
          <div className="h-10 w-16 bg-[#1a1a25] animate-pulse rounded" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#1a1a25] animate-pulse" />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

/* ─── Tab Icons ──────────────────────────────────────── */
function GridTabIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-white" : "text-gray-700"}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function BookmarkTabIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-white" : "text-gray-700"}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function PersonTabIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-white" : "text-gray-700"}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

/* ─── Post Grid Component ────────────────────────────── */
function PostGrid({
  posts,
  onSelect,
}: {
  posts: ProfilePost[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-0.5 max-w-[600px] mx-auto mt-1">
      {posts.map((post) => {
        const likes = post._count?.likes ?? post.likesCount ?? 0;
        const comments = post._count?.comments ?? post.commentsCount ?? 0;
        return (
          <button
            key={post.id}
            onClick={() => onSelect(post.id)}
            className="relative aspect-square overflow-hidden group cursor-pointer bg-[#111118]"
          >
            <Image
              src={post.mediaUrl}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 600px) 33vw, 200px"
            />
            {post.mediaType === "VIDEO" && (
              <div className="absolute top-2 right-2">
                <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
              <span className="flex items-center gap-1 text-white text-xs font-semibold translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                <HeartIcon filled className="w-4 h-4" />
                {likes}
              </span>
              <span className="flex items-center gap-1 text-white text-xs font-semibold translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                <CommentIcon className="w-4 h-4" />
                {comments}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export default function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [savedPosts, setSavedPosts] = useState<ProfilePost[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Digital twin state
  const [twinHeight, setTwinHeight] = useState(170);
  const [twinWeight, setTwinWeight] = useState(70);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [syncingAi, setSyncingAi] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  /* ─── Fetch profile ───────────────────────────────── */
  const fetchProfile = useCallback(async () => {
    const res = await fetch(`/api/users/profile/${params.username}`);
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setIsFollowing(data.isFollowing);
      if (data.height) setTwinHeight(data.height);
      if (data.weight) setTwinWeight(data.weight);
    } else if (res.status === 404) {
      setNotFound(true);
    } else {
      router.push("/feed");
    }
    setLoading(false);
  }, [params.username, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ─── Saved posts ─────────────────────────────────── */
  async function loadSavedPosts() {
    if (savedLoaded) return;
    const res = await fetch("/api/users/me/saved");
    if (res.ok) setSavedPosts(await res.json());
    setSavedLoaded(true);
  }

  /* ─── Follow ──────────────────────────────────────── */
  async function handleFollow() {
    if (!profile) return;
    const prev = isFollowing;
    setIsFollowing(!isFollowing);
    setProfile((p) =>
      p ? { ...p, followersCount: prev ? p.followersCount - 1 : p.followersCount + 1 } : p
    );
    const res = await fetch(`/api/users/${profile.id}/follow`, { method: "POST" });
    if (!res.ok) {
      setIsFollowing(prev);
      setProfile((p) =>
        p ? { ...p, followersCount: prev ? p.followersCount : p.followersCount - 1 } : p
      );
    }
  }

  /* ─── Tab change ──────────────────────────────────── */
  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (tab === "saved" && !savedLoaded) loadSavedPosts();
  }

  /* ─── Post deleted ────────────────────────────────── */
  function handlePostDeleted() {
    setProfile((p) =>
      p ? { ...p, postsCount: p.postsCount - 1, posts: p.posts.filter((post) => post.id !== selectedPostId) } : p
    );
    setSelectedPostId(null);
  }

  /* ─── Photo upload handlers ───────────────────────── */
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string | null) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSyncAi() {
    setSyncingAi(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ height: twinHeight, weight: twinWeight }),
      });
      fetchProfile();
    } catch { /* silent */ }
    setSyncingAi(false);
  }

  /* ─── Derived ─────────────────────────────────────── */
  const estimatedSize = estimateSize(twinHeight, twinWeight);
  const scaleX = 0.8 + ((twinWeight - 40) / 110) * 0.5;
  const scaleY = 0.85 + ((twinHeight - 140) / 70) * 0.3;

  /* ─── Loading / Not Found ─────────────────────────── */
  if (loading) return <ProfileSkeleton />;

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pb-28">
        <TopHeader />
        <main className="max-w-[600px] mx-auto flex flex-col items-center justify-center py-32 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/10 flex items-center justify-center mb-6">
            <PersonTabIcon active={false} />
          </div>
          <p className="text-base font-bold text-white mb-2">Perfil no encontrado</p>
          <p className="text-sm text-gray-600 mb-8">Este usuario no existe o fue eliminado</p>
          <Link
            href="/feed"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
          >
            Volver al feed
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const profileImg = profile.profilePhoto || profile.avatar;
  const selectedPost = profile.posts.find((p) => p.id === selectedPostId);
  const selectedSavedPost = savedPosts.find((p) => p.id === selectedPostId);
  const modalPost = selectedPost || selectedSavedPost;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-28">
      <TopHeader />

      {/* ═══ BANNER ═══ */}
      <div className="relative h-40 w-full overflow-hidden mt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-[#111118] to-pink-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.15)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-[-50%] left-[20%] w-64 h-64 rounded-full bg-purple-600/20 blur-[60px]" />
        <div className="absolute top-[-30%] right-[10%] w-48 h-48 rounded-full bg-pink-600/15 blur-[50px]" />
      </div>

      {/* ═══ PROFILE HEADER ═══ */}
      <div className="max-w-[600px] mx-auto px-4">
        {/* Avatar + buttons row */}
        <div className="relative -mt-14 mb-4 flex items-end justify-between">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-[#0a0a0f] shadow-[0_0_30px_rgba(168,85,247,0.3)] overflow-hidden flex-shrink-0">
            {profileImg ? (
              <Image
                src={profileImg}
                alt={profile.username}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl font-black">
                {profile.fullName[0]}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1">
            {profile.isOwner ? (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm font-semibold hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-150 active:scale-95"
                >
                  Editar perfil
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 text-sm font-semibold hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all duration-150 active:scale-95"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 ${
                  isFollowing
                    ? "bg-white/[0.06] border border-white/[0.1] text-gray-400 hover:bg-white/[0.1]"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                }`}
              >
                {isFollowing ? "Siguiendo" : "Seguir"}
              </button>
            )}
          </div>
        </div>

        {/* Name + username + bio */}
        <h2 className="text-xl font-black text-white tracking-tight">{profile.fullName}</h2>
        <p className="text-sm text-gray-600 mt-0.5">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{profile.bio}</p>
        )}

        {/* Style badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="text-purple-400 text-xs">✦</span>
            <span className="text-xs font-semibold text-purple-300">Streetwear</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="text-gray-500 text-xs">🔥</span>
            <span className="text-xs font-semibold text-gray-500">Casual</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-5 py-4 border-t border-b border-white/[0.06]">
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-xl font-black text-white">{profile.postsCount}</span>
            <span className="text-[11px] font-medium text-gray-600 tracking-wide">posts</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-xl font-black text-white">{profile.followersCount}</span>
            <span className="text-[11px] font-medium text-gray-600 tracking-wide">seguidores</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-xl font-black text-white">{profile.followingCount}</span>
            <span className="text-[11px] font-medium text-gray-600 tracking-wide">siguiendo</span>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex border-b border-white/[0.06] mt-2">
          <button
            onClick={() => handleTabChange("posts")}
            className={`flex-1 flex items-center justify-center py-3.5 relative cursor-pointer transition-colors duration-150 ${
              activeTab === "posts" ? "text-white" : "text-gray-700 hover:text-gray-400"
            }`}
          >
            <GridTabIcon active={activeTab === "posts"} />
            {activeTab === "posts" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>
          {profile.isOwner && (
            <button
              onClick={() => handleTabChange("saved")}
              className={`flex-1 flex items-center justify-center py-3.5 relative cursor-pointer transition-colors duration-150 ${
                activeTab === "saved" ? "text-white" : "text-gray-700 hover:text-gray-400"
              }`}
            >
              <BookmarkTabIcon active={activeTab === "saved"} />
              {activeTab === "saved" && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              )}
            </button>
          )}
          <button
            onClick={() => handleTabChange("twin")}
            className={`flex-1 flex items-center justify-center py-3.5 relative cursor-pointer transition-colors duration-150 ${
              activeTab === "twin" ? "text-white" : "text-gray-700 hover:text-gray-400"
            }`}
          >
            <PersonTabIcon active={activeTab === "twin"} />
            {activeTab === "twin" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}

      {/* TAB 1 — Posts */}
      {activeTab === "posts" && (
        profile.posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/10 flex items-center justify-center">
              <GridTabIcon active={false} />
            </div>
            <p className="text-base font-bold text-gray-700">Sin posts aún</p>
            <p className="text-sm text-gray-700 text-center px-8 leading-relaxed">
              Publica tu primer outfit para que aparezca aquí
            </p>
          </div>
        ) : (
          <PostGrid posts={profile.posts} onSelect={setSelectedPostId} />
        )
      )}

      {/* TAB 2 — Saved */}
      {activeTab === "saved" && (
        !savedLoaded ? (
          <div className="grid grid-cols-3 gap-0.5 max-w-[600px] mx-auto mt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-[#1a1a25] animate-pulse" />
            ))}
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/10 flex items-center justify-center">
              <BookmarkTabIcon active={false} />
            </div>
            <p className="text-base font-bold text-gray-700">Sin guardados</p>
            <p className="text-sm text-gray-700 text-center px-8 leading-relaxed">
              Los posts que guardes aparecerán aquí
            </p>
          </div>
        ) : (
          <PostGrid posts={savedPosts} onSelect={setSelectedPostId} />
        )
      )}

      {/* TAB 3 — Digital Twin */}
      {activeTab === "twin" && (
        <div className="max-w-[600px] mx-auto px-4 py-6 space-y-5">
          {/* Mannequin viewer */}
          <div className="relative bg-[#111118] border border-white/[0.07] rounded-[24px] overflow-hidden aspect-[3/4] flex items-center justify-center">
            {/* Dot grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.1)_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Mannequin SVG */}
            <svg
              viewBox="0 0 100 180"
              className="relative z-10 w-1/2 text-purple-500"
              style={{
                transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
                filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))",
                transition: "transform 0.4s ease",
              }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M50 20 a10 10 0 1 0 0 20 a10 10 0 1 0 0 -20 M40 45 q10 -5 20 0 v40 q-10 5 -20 0 v-40 M38 46 q-10 5 -10 25 M62 46 q10 5 10 25 M42 85 v80 M58 85 v80" />
            </svg>

            {/* Size badge */}
            <div className="absolute bottom-4 right-4 bg-[rgba(10,10,15,0.8)] backdrop-blur-sm border border-white/[0.1] rounded-2xl px-4 py-3 z-10">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Talla</p>
              <p className="text-2xl font-black text-white text-center">{estimatedSize}</p>
            </div>
          </div>

          {/* Physical sliders */}
          <div className="bg-[#111118] border border-white/[0.07] rounded-[20px] p-6 space-y-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-600">
              Ajustes físicos
            </p>

            {/* Height */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-sm font-medium text-gray-500">Estatura</p>
                <p className="text-sm font-bold text-purple-400">{twinHeight} cm</p>
              </div>
              <input
                type="range"
                min={140}
                max={210}
                value={twinHeight}
                onChange={(e) => setTwinHeight(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-700">140 cm</span>
                <span className="text-[10px] text-gray-700">210 cm</span>
              </div>
            </div>

            {/* Weight */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-sm font-medium text-gray-500">Peso</p>
                <p className="text-sm font-bold text-purple-400">{twinWeight} kg</p>
              </div>
              <input
                type="range"
                min={40}
                max={150}
                value={twinWeight}
                onChange={(e) => setTwinWeight(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-700">40 kg</span>
                <span className="text-[10px] text-gray-700">150 kg</span>
              </div>
            </div>
          </div>

          {/* Technical sizes card */}
          <div className="bg-[#111118] border border-white/[0.07] rounded-[20px] p-6 space-y-4">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400">
              Ficha técnica de tallas
            </p>

            {[
              { label: "Camisas / Tops", measure: `${shoulderMeasure(twinHeight, twinWeight)} cm`, measureLabel: "Hombros" },
              { label: "Pantalones", measure: `${waistMeasure(twinHeight, twinWeight)} cm`, measureLabel: "Cintura" },
              { label: "Calzado", measure: `${shoeSize(twinHeight)} EU`, measureLabel: "Talla EU" },
            ].map((item) => (
              <div key={item.label} className="border-l-2 border-purple-500 bg-white/[0.03] rounded-r-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-medium text-gray-500">{item.label}</p>
                    <p className="text-2xl font-black text-white mt-1">{estimatedSize}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-purple-300">{item.measure}</p>
                    <p className="text-[10px] text-gray-600">{item.measureLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Biometric photos */}
          <div className="bg-[#111118] border border-white/[0.07] rounded-[20px] p-6 space-y-4">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-600">
              Fotos biométricas
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Front */}
              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-2">Foto frontal</p>
                <button
                  onClick={() => frontInputRef.current?.click()}
                  className="w-full aspect-square bg-[#0a0a0f] border-2 border-dashed border-white/[0.1] rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/[0.03] transition-all flex items-center justify-center overflow-hidden group"
                >
                  {frontPhoto ? (
                    <Image src={frontPhoto} alt="Frontal" width={200} height={200} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-700 group-hover:text-purple-500/60 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                </button>
                <input ref={frontInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setFrontPhoto)} className="hidden" />
              </div>
              {/* Side */}
              <div>
                <p className="text-[11px] font-medium text-gray-600 mb-2">Foto lateral</p>
                <button
                  onClick={() => sideInputRef.current?.click()}
                  className="w-full aspect-square bg-[#0a0a0f] border-2 border-dashed border-white/[0.1] rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/[0.03] transition-all flex items-center justify-center overflow-hidden group"
                >
                  {sidePhoto ? (
                    <Image src={sidePhoto} alt="Lateral" width={200} height={200} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-700 group-hover:text-purple-500/60 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                </button>
                <input ref={sideInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setSidePhoto)} className="hidden" />
              </div>
            </div>
            <button
              onClick={handleSyncAi}
              disabled={syncingAi || (!frontPhoto && !sidePhoto)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              {syncingAi ? "Analizando..." : "Sincronizar con IA"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Post detail modal */}
      {modalPost && selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          mediaUrl={modalPost.mediaUrl}
          mediaType={modalPost.mediaType}
          caption={modalPost.caption}
          createdAt={modalPost.createdAt}
          postUserId={profile.id}
          onClose={() => setSelectedPostId(null)}
          onDelete={profile.isOwner ? handlePostDeleted : undefined}
        />
      )}

      {/* Edit profile modal */}
      {showEditModal && (
        <EditProfileModal
          user={profile}
          onClose={() => setShowEditModal(false)}
          onSave={fetchProfile}
        />
      )}
    </div>
  );
}
