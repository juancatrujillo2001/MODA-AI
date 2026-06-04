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

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 text-[10px] font-black uppercase tracking-widest animate-fade-in ${
      type === "success" ? "bg-black text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  }

  async function deletePost(postId: string, username: string) {
    if (!confirm(`Eliminar post de @${username}? Esta accion es permanente.`)) return;
    setDeletingId(postId);
    const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotal((t) => t - 1);
      setToast({ message: "Post eliminado", type: "success" });
    } else {
      setToast({ message: "Error al eliminar post", type: "error" });
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-black">
            Posts
          </h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            {total} posts publicados
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BUSCAR POR CAPTION O USERNAME..."
            className="text-[10px] font-bold uppercase tracking-widest border border-gray-100 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-700 w-72 placeholder:text-gray-300"
          />
          <button
            type="submit"
            className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-purple-700 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-gray-100 animate-pulse">
              <div className="aspect-square bg-gray-50" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-2 bg-gray-50 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-gray-100 text-center py-16">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
            No se encontraron posts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-100 overflow-hidden">
              {/* Media */}
              <div className="relative aspect-square bg-gray-50">
                {post.mediaType === "VIDEO" ? (
                  <video src={post.mediaUrl} className="w-full h-full object-cover" muted />
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
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1">
                    VIDEO
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-300 flex-shrink-0 overflow-hidden">
                    {post.user.profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      post.user.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider">
                    @{post.user.username}
                  </p>
                </div>

                {post.caption && (
                  <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">
                    {post.caption}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[9px] text-gray-400">
                    <span>{post._count.likes} likes</span>
                    <span>{post._count.comments} comentarios</span>
                  </div>
                  <p className="text-[8px] text-gray-300">{formatTimeAgo(post.createdAt)}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deletePost(post.id, post.user.username)}
                  disabled={deletingId === post.id}
                  className="w-full mt-3 text-[9px] font-black uppercase tracking-widest py-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {deletingId === post.id ? "Eliminando..." : "Eliminar Post"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-widest">
            Pagina {page} de {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-gray-100 disabled:opacity-30 hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-gray-100 disabled:opacity-30 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
