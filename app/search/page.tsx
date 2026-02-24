"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PostDetailModal } from "@/components/profile/post-detail-modal";

interface UserResult {
  id: string;
  username: string;
  fullName: string;
  profilePhoto: string | null;
  avatar: string | null;
  _count: { followers: number };
}

interface PostResult {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  _count: { likes: number; comments: number };
  user: { username: string; profilePhoto: string | null; avatar: string | null };
}

interface BrandResult {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  _count: { garments: number };
}

type SearchType = "all" | "users" | "posts" | "brands";

const TABS: { label: string; value: SearchType }[] = [
  { label: "All", value: "all" },
  { label: "Users", value: "users" },
  { label: "Posts", value: "posts" },
  { label: "Brands", value: "brands" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [brands, setBrands] = useState<BrandResult[]>([]);
  const [trending, setTrending] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load trending on mount
  useEffect(() => {
    async function loadTrending() {
      const res = await fetch("/api/posts/trending");
      if (res.ok) setTrending(await res.json());
    }
    loadTrending();
  }, []);

  const search = useCallback(
    async (q: string, t: SearchType) => {
      if (q.length < 2) {
        setHasSearched(false);
        setUsers([]);
        setPosts([]);
        setBrands([]);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&type=${t}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPosts(data.posts || []);
        setBrands(data.brands || []);
      }
      setLoading(false);
    },
    []
  );

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value, type), 300);
  }

  function handleTypeChange(t: SearchType) {
    setType(t);
    if (query.length >= 2) search(query, t);
  }

  const selectedPost =
    [...posts, ...trending].find((p) => p.id === selectedPostId) || null;

  const showExplorer = !hasSearched;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopHeader />

      <main className="max-w-screen-md mx-auto">
        {/* Search bar */}
        <div className="sticky top-14 z-40 bg-gray-50 px-4 pt-3 pb-2">
          <div className="relative">
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search users, outfits, brands..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setHasSearched(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tabs */}
          {hasSearched && (
            <div className="flex gap-2 mt-3">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTypeChange(tab.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    type === tab.value
                      ? "bg-brand-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Search Results */}
        {hasSearched && !loading && (
          <div className="px-4">
            {/* Users */}
            {users.length > 0 && (type === "all" || type === "users") && (
              <section className="mb-6">
                {type === "all" && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Users
                  </h3>
                )}
                <div className="space-y-3">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 py-1"
                    >
                      <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {(user.profilePhoto || user.avatar) ? (
                          <Image
                            src={user.profilePhoto || user.avatar || ""}
                            alt={user.username}
                            width={44}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                            {user.fullName[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.fullName} &middot;{" "}
                          {user._count.followers} followers
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Brands */}
            {brands.length > 0 && (type === "all" || type === "brands") && (
              <section className="mb-6">
                {type === "all" && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Brands
                  </h3>
                )}
                <div className="space-y-3">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center gap-3 py-1"
                    >
                      <div className="w-11 h-11 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {brand.logo ? (
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            width={44}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-400">
                            {brand.name[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {brand.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {brand._count.garments} items
                          {brand.description && ` · ${brand.description}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {posts.length > 0 && (type === "all" || type === "posts") && (
              <section className="mb-6">
                {type === "all" && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Posts
                  </h3>
                )}
                <div className="grid grid-cols-3 gap-0.5">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className="relative aspect-square bg-gray-100"
                    >
                      <Image
                        src={post.mediaUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="33vw"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {users.length === 0 &&
              posts.length === 0 &&
              brands.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Trending Explorer */}
        {showExplorer && (
          <div>
            <h3 className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Explore
            </h3>
            {trending.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">
                No posts to explore yet. Be the first to post!
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {trending.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`relative bg-gray-100 ${
                      // Make every 3rd item span 2 rows for visual variety
                      i % 9 === 0 ? "row-span-2 aspect-[1/2]" : "aspect-square"
                    }`}
                  >
                    <Image
                      src={post.mediaUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="33vw"
                    />
                  </button>
                ))}
              </div>
            )}
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
