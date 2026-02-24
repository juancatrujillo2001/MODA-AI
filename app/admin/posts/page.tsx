"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/utils";

interface AdminPost {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePhoto: string | null;
  };
  _count: { likes: number; comments: number };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "12" });
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/posts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  }

  async function deletePost(postId: string, username: string) {
    if (!confirm(`Delete post by @${username}? This is permanent.`)) return;

    setDeletingId(postId);
    const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });

    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotal((t) => t - 1);
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Failed to delete post");
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Posts ({total})</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by caption or username..."
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 w-72"
          />
          <button
            type="submit"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Search
          </button>
        </form>
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <p className="text-gray-500">No posts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Media */}
              <div className="relative aspect-square bg-gray-100">
                {post.mediaType === "VIDEO" ? (
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <Image
                    src={post.mediaUrl}
                    alt={post.caption || "Post"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
                {post.mediaType === "VIDEO" && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    VIDEO
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 overflow-hidden">
                    {post.user.profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      post.user.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="text-sm font-medium">@{post.user.username}</p>
                </div>

                {post.caption && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {post.caption}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{post._count.likes} likes</span>
                    <span>{post._count.comments} comments</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {formatTimeAgo(post.createdAt)}
                  </p>
                </div>

                {/* Delete action */}
                <button
                  onClick={() => deletePost(post.id, post.user.username)}
                  disabled={deletingId === post.id}
                  className="w-full mt-3 text-xs font-medium py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === post.id ? "Deleting..." : "Delete Post"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-3">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
