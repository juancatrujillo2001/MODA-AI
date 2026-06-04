"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchIcon, HeartIcon, XIcon } from "@/components/icons";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PostDetailModal } from "@/components/profile/post-detail-modal";

/* ─── Types ──────────────────────────────────────────── */
interface UserResult {
  id: string;
  username: string;
  fullName: string;
  profilePhoto: string | null;
  avatar: string | null;
  _count: { followers: number; posts?: number };
}

interface PostResult {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  aiDescription: string | null;
  detectedItems: DetectedItem[] | null;
  _count: { likes: number; comments: number };
  user: { username: string; profilePhoto: string | null; avatar: string | null };
}

interface DetectedItem {
  name: string;
  category: string;
  color: string;
  confidence: number;
  brand?: string;
}

interface BrandResult {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  _count: { garments: number };
}

/* ─── Filter chips ───────────────────────────────────── */
const STYLE_FILTERS = [
  "Todo",
  "Hombre",
  "Mujer",
  "Streetwear",
  "Casual",
  "Formal",
  "Vintage",
  "Minimalista",
  "Y2K",
  "Luxury",
];

const AI_CHIPS = [
  "Looks de invierno",
  "Estilo Oversize",
  "Minimalismo Puro",
  "Streetwear 2025",
  "Quiet Luxury",
  "Office Core",
  "Dark Academia",
];

/* ─── Skeleton components ────────────────────────────── */
function SkeletonRect({ className }: { className: string }) {
  return <div className={`animate-pulse bg-[#1a1a25] ${className}`} />;
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 items-center py-2">
      <SkeletonRect className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonRect className="h-3 w-24 rounded" />
        <SkeletonRect className="h-2.5 w-16 rounded" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="columns-3 gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <SkeletonRect
          key={i}
          className={`w-full mb-1.5 rounded-2xl ${
            i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]"
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Helper: extract style from aiDescription ───────── */
function extractStyle(aiDescription: string | null): string | null {
  if (!aiDescription) return null;
  const parts = aiDescription.split(" | Style: ");
  return parts[1] || null;
}

/* ─── Main Page ──────────────────────────────────────── */
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todo");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [brands, setBrands] = useState<BrandResult[]>([]);
  const [allBrands, setAllBrands] = useState<BrandResult[]>([]);
  const [trendingUsers, setTrendingUsers] = useState<UserResult[]>([]);
  const [explorePosts, setExplorePosts] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // AI assistant
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Visual search
  const [visualFile, setVisualFile] = useState<File | null>(null);
  const [visualPreview, setVisualPreview] = useState<string | null>(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualResults, setVisualResults] = useState<PostResult[]>([]);

  // Follow state for brands and users
  const [followedBrands, setFollowedBrands] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const debounceRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Load initial data ───────────────────────────── */
  useEffect(() => {
    async function loadInitial() {
      const [brandsRes, usersRes, postsRes] = await Promise.allSettled([
        fetch("/api/brands"),
        fetch("/api/users/trending"),
        fetch("/api/posts/trending"),
      ]);

      if (brandsRes.status === "fulfilled" && brandsRes.value.ok) {
        setAllBrands(await brandsRes.value.json());
      }
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        setTrendingUsers(await usersRes.value.json());
      }
      if (postsRes.status === "fulfilled" && postsRes.value.ok) {
        setExplorePosts(await postsRes.value.json());
      }
      setInitialLoading(false);
    }
    loadInitial();
  }, []);

  /* ─── Search handler ──────────────────────────────── */
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setHasSearched(false);
      setUsers([]);
      setPosts([]);
      setBrands([]);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setPosts(data.posts || []);
      setBrands(data.brands || []);
    }
    setLoading(false);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function handleFilterClick(filter: string) {
    setActiveFilter(filter);
    if (filter !== "Todo") {
      setQuery(filter);
      search(filter);
    } else {
      setQuery("");
      setHasSearched(false);
    }
  }

  /* ─── AI search handler ───────────────────────────── */
  async function handleAiSearch(searchQuery?: string) {
    const q = searchQuery || aiQuery;
    if (!q.trim()) return;
    setAiLoading(true);
    setQuery(q);
    setHasSearched(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=posts`);
    if (res.ok) {
      const data = await res.json();
      setUsers([]);
      setBrands([]);
      setPosts(data.posts || []);
    }
    setAiLoading(false);
    setLoading(false);
  }

  function handleChipClick(chip: string) {
    setAiQuery(chip);
    setQuery(chip);
    handleAiSearch(chip);
  }

  /* ─── Visual search handler ───────────────────────── */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVisualFile(file);
    setVisualPreview(URL.createObjectURL(file));
  }

  async function handleVisualSearch() {
    if (!visualFile) return;
    setVisualLoading(true);

    const formData = new FormData();
    formData.append("file", visualFile);

    const res = await fetch(`/api/search?q=${encodeURIComponent("outfit style")}&type=posts`);
    if (res.ok) {
      const data = await res.json();
      setVisualResults(data.posts || []);
    }
    setVisualLoading(false);
  }

  /* ─── Follow toggles ─────────────────────────────── */
  function toggleBrandFollow(brandId: string) {
    setFollowedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  }

  function toggleUserFollow(userId: string) {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
    fetch(`/api/users/${userId}/follow`, { method: "POST" }).catch(() => {});
  }

  /* ─── Find selected post for modal ────────────────── */
  const allPosts = [...posts, ...explorePosts, ...visualResults];
  const selectedPost = allPosts.find((p) => p.id === selectedPostId) || null;
  const showExplorer = !hasSearched;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24 pt-4">
      <TopHeader />

      <main className="max-w-[600px] mx-auto px-4 space-y-6">
        {/* ═══════════════════════════════════════════════
            SECTION 1 — SEARCH BAR + FILTERS
            ═══════════════════════════════════════════════ */}
        <div className="sticky top-14 z-40 bg-[rgba(10,10,15,0.9)] backdrop-blur-xl pt-3 pb-2 -mx-4 px-4">
          {/* Search input */}
          <div className="relative max-w-[600px] mx-auto">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar usuarios, outfits, marcas..."
              className="w-full bg-[#111118] border border-white/[0.08] rounded-2xl px-5 py-4 pl-12 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all duration-200"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setHasSearched(false);
                  setActiveFilter("Todo");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide mt-3">
            {STYLE_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  activeFilter === filter
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "border border-white/[0.08] text-gray-500 hover:border-white/[0.2] hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SEARCH RESULTS
            ═══════════════════════════════════════════════ */}
        {hasSearched && (
          <div className="pt-2">
            {/* Loading */}
            {(loading || aiLoading) && (
              <div className="space-y-4">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonGrid />
              </div>
            )}

            {!loading && !aiLoading && (
              <>
                {/* Users results */}
                {users.length > 0 && (
                  <section className="mb-6">
                    <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600 mb-4">
                      Usuarios
                    </h3>
                    <div className="space-y-3">
                      {users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.username}`}
                          className="flex items-center gap-3 py-1 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 overflow-hidden flex-shrink-0">
                            {(user.profilePhoto || user.avatar) ? (
                              <Image
                                src={user.profilePhoto || user.avatar || ""}
                                alt={user.username}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-purple-400">
                                {user.fullName[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {user.fullName} &middot; {user._count.followers} followers
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Brands results */}
                {brands.length > 0 && (
                  <section className="mb-6">
                    <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600 mb-4">
                      Marcas
                    </h3>
                    <div className="space-y-3">
                      {brands.map((brand) => (
                        <div key={brand.id} className="flex items-center gap-3 py-1">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {brand.logo ? (
                              <Image
                                src={brand.logo}
                                alt={brand.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-purple-400">
                                {brand.name[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {brand.name}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {brand._count.garments} items
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Posts results grid */}
                {posts.length > 0 && (
                  <section className="mb-6">
                    <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600 mb-4">
                      Outfits
                    </h3>
                    <div className="columns-3 gap-1.5">
                      {posts.map((post, i) => {
                        const style = extractStyle(post.aiDescription);
                        return (
                          <button
                            key={post.id}
                            onClick={() => setSelectedPostId(post.id)}
                            className={`relative w-full mb-1.5 overflow-hidden group break-inside-avoid rounded-2xl ${
                              i % 3 === 0
                                ? "aspect-[3/4]"
                                : i % 3 === 1
                                  ? "aspect-square"
                                  : "aspect-[4/3]"
                            }`}
                          >
                            <Image
                              src={post.mediaUrl}
                              alt=""
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <HeartIcon className="w-5 h-5 text-white" />
                              <span className="text-white text-xs font-bold ml-1">
                                {post._count.likes}
                              </span>
                            </div>
                            {style && (
                              <span className="absolute top-2 left-2 bg-[rgba(10,10,15,0.8)] backdrop-blur-sm text-purple-300 text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-white/[0.1]">
                                {style}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* No results */}
                {users.length === 0 && posts.length === 0 && brands.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#111118] rounded-full flex items-center justify-center border border-white/[0.07]">
                      <SearchIcon className="w-6 h-6 text-gray-700" />
                    </div>
                    <p className="text-sm font-bold text-white mb-2">
                      Sin resultados
                    </p>
                    <p className="text-xs text-gray-600 max-w-xs mx-auto">
                      No encontramos outfits con ese estilo. Se el primero en publicarlo.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            EXPLORER (when not searching)
            ═══════════════════════════════════════════════ */}
        {showExplorer && (
          <div className="space-y-8">
            {/* ═══════════════════════════════════════════
                SECTION 2 — AI STYLE ASSISTANT
                ═══════════════════════════════════════════ */}
            <section className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400">
                  ¿Qué quieres descubrir hoy?
                </span>
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-2">
                {AI_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 text-xs font-medium hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300 transition-all duration-150 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* AI search input */}
              <div className="flex items-center gap-3 bg-[#0a0a0f] border border-white/[0.06] rounded-xl px-4 py-3">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                  placeholder="Describe el outfit que buscas..."
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-700 text-sm focus:outline-none px-0"
                />
                <button
                  onClick={() => handleAiSearch()}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all duration-150 active:scale-95 disabled:opacity-40 whitespace-nowrap"
                >
                  {aiLoading ? "..." : "Buscar con IA"}
                </button>
              </div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 3 — TOP BRANDS
                ═══════════════════════════════════════════ */}
            <section>
              <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600 mb-4">
                Top Brands
              </h3>
              {initialLoading ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                      <SkeletonRect className="w-[100px] h-[100px] rounded-2xl" />
                      <SkeletonRect className="w-12 h-2 rounded" />
                    </div>
                  ))}
                </div>
              ) : allBrands.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No hay marcas disponibles
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {allBrands.map((brand) => {
                    const isFollowed = followedBrands.has(brand.id);
                    return (
                      <div
                        key={brand.id}
                        className="flex-shrink-0 flex flex-col items-center gap-2 p-4 bg-[#111118] border border-white/[0.07] rounded-2xl min-w-[100px] hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all duration-200"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center overflow-hidden">
                          {brand.logo ? (
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-purple-300">
                              {brand.name[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-white tracking-tight text-center w-20 truncate">
                          {brand.name}
                        </p>
                        <button
                          onClick={() => toggleBrandFollow(brand.id)}
                          className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all duration-150 ${
                            isFollowed
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                              : "bg-white/[0.05] border border-white/[0.1] text-gray-400 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300"
                          }`}
                        >
                          {isFollowed ? "Siguiendo" : "Seguir"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 4 — TRENDING PROFILES
                ═══════════════════════════════════════════ */}
            <section>
              <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600 mb-4">
                Trending Profiles
              </h3>
              {initialLoading ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-36">
                      <SkeletonRect className="w-full h-32 rounded-2xl" />
                    </div>
                  ))}
                </div>
              ) : trendingUsers.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No hay perfiles en tendencia
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {trendingUsers.map((user) => {
                    const isFollowed = followedUsers.has(user.id);
                    const profileImg = user.profilePhoto || user.avatar;
                    return (
                      <div
                        key={user.id}
                        className="flex-shrink-0 flex flex-col items-center gap-2 p-4 bg-[#111118] border border-white/[0.07] rounded-2xl min-w-[130px] hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all duration-200"
                      >
                        <Link href={`/profile/${user.username}`}>
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 overflow-hidden flex items-center justify-center">
                            {profileImg ? (
                              <Image
                                src={profileImg}
                                alt={user.username}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                              </svg>
                            )}
                          </div>
                        </Link>
                        <Link href={`/profile/${user.username}`} className="text-center">
                          <p className="text-xs font-bold text-white tracking-tight truncate w-full">
                            {user.username}
                          </p>
                          <p className="text-[10px] text-gray-600">
                            {user._count.posts ?? 0} posts
                          </p>
                        </Link>
                        <button
                          onClick={() => toggleUserFollow(user.id)}
                          className={`w-full px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-150 active:scale-95 ${
                            isFollowed
                              ? "bg-white/[0.05] border border-white/[0.1] text-gray-400"
                              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                          }`}
                        >
                          {isFollowed ? "Siguiendo" : "Seguir"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 5 — EXPLORE OUTFITS (Masonry)
                ═══════════════════════════════════════════ */}
            <section>
              <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600 mb-4">
                Explore Outfits
              </h3>
              {initialLoading ? (
                <SkeletonGrid />
              ) : explorePosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-gray-600">
                    No hay outfits para explorar. Se el primero en publicar.
                  </p>
                </div>
              ) : (
                <div className="columns-3 gap-1.5">
                  {explorePosts.map((post, i) => {
                    const style = extractStyle(post.aiDescription);
                    return (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPostId(post.id)}
                        className={`relative w-full mb-1.5 overflow-hidden group break-inside-avoid rounded-2xl ${
                          i % 3 === 0
                            ? "aspect-[3/4]"
                            : i % 3 === 1
                              ? "aspect-square"
                              : "aspect-[4/3]"
                        }`}
                      >
                        <Image
                          src={post.mediaUrl}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <HeartIcon className="w-5 h-5 text-white" />
                          <span className="text-white text-xs font-bold ml-1">
                            {post._count.likes}
                          </span>
                        </div>
                        {style && (
                          <span className="absolute top-2 left-2 bg-[rgba(10,10,15,0.8)] backdrop-blur-sm text-purple-300 text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-white/[0.1]">
                            {style}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 6 — VISUAL SEARCH (BETA)
                ═══════════════════════════════════════════ */}
            <section className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600">
                  Buscar por foto
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold tracking-widest">
                  BETA
                </span>
              </div>

              {!visualPreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full border-2 border-dashed border-white/[0.1] rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/[0.03] transition-all duration-200 group"
                >
                  <svg
                    className="w-10 h-10 text-gray-700 group-hover:text-purple-500/60 transition-colors duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                    />
                  </svg>
                  <p className="text-xs text-gray-700 text-center leading-relaxed group-hover:text-gray-500 transition-colors">
                    Sube una foto de un outfit y encontramos looks similares
                  </p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-full aspect-[4/3] bg-[#111118] rounded-2xl overflow-hidden">
                    <Image
                      src={visualPreview}
                      alt="Upload preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => {
                        setVisualFile(null);
                        setVisualPreview(null);
                        setVisualResults([]);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-[rgba(10,10,15,0.7)] backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
                    >
                      <XIcon className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <button
                    onClick={handleVisualSearch}
                    disabled={visualLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] disabled:opacity-40 transition-all active:scale-[0.98]"
                  >
                    {visualLoading ? "Buscando..." : "Buscar looks similares"}
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Visual search results */}
              {visualResults.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-gray-600 mb-3">
                    Looks similares
                  </p>
                  <div className="columns-3 gap-1.5">
                    {visualResults.map((post, i) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPostId(post.id)}
                        className={`relative w-full mb-1.5 overflow-hidden group break-inside-avoid rounded-2xl ${
                          i % 3 === 0
                            ? "aspect-[3/4]"
                            : i % 3 === 1
                              ? "aspect-square"
                              : "aspect-[4/3]"
                        }`}
                      >
                        <Image
                          src={post.mediaUrl}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <HeartIcon className="w-5 h-5 text-white" />
                          <span className="text-white text-xs font-bold ml-1">
                            {post._count.likes}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Post detail modal */}
      {selectedPost && selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          mediaUrl={selectedPost.mediaUrl}
          mediaType={selectedPost.mediaType}
          caption={selectedPost.caption}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}
