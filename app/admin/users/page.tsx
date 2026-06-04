"use client";

import { useState, useEffect, useCallback } from "react";
import { formatTimeAgo } from "@/lib/utils";

interface AdminUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profilePhoto: string | null;
  avatar: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
    closetItems: number;
  };
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "15" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  async function toggleAdmin(userId: string, currentAdmin: boolean) {
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !currentAdmin }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isAdmin: !currentAdmin } : u));
      setToast({ message: !currentAdmin ? "Admin asignado" : "Admin revocado", type: "success" });
    } else {
      setToast({ message: "Error al actualizar usuario", type: "error" });
    }
    setActionLoading(null);
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Eliminar usuario @${username}? Se eliminaran todos sus datos permanentemente.`)) return;
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTotal((t) => t - 1);
      setToast({ message: "Usuario eliminado", type: "success" });
    } else {
      setToast({ message: "Error al eliminar usuario", type: "error" });
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-black">
            Usuarios
          </h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            {total} usuarios registrados
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BUSCAR POR USERNAME O EMAIL..."
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

      {/* Table */}
      <div className="border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                  <div className="h-2 w-24 bg-gray-50 rounded" />
                </div>
                <div className="h-3 w-20 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
              No se encontraron usuarios
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest px-6 py-3">Usuario</th>
                  <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest px-6 py-3">Email</th>
                  <th className="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-3">Posts</th>
                  <th className="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-3">Seguidores</th>
                  <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-3">Rol</th>
                  <th className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-3">Registro</th>
                  <th className="text-right text-[9px] font-black text-gray-400 uppercase tracking-widest px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-300 flex-shrink-0 overflow-hidden">
                          {user.profilePhoto || user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profilePhoto || user.avatar!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider">{user.fullName}</p>
                          <p className="text-[9px] text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[10px] text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 text-[10px] font-black text-center">{user._count.posts}</td>
                    <td className="px-4 py-3 text-[10px] font-black text-center">{user._count.followers}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 ${
                        user.isAdmin
                          ? "bg-purple-50 text-purple-700 border border-purple-100"
                          : "bg-gray-50 text-gray-400 border border-gray-100"
                      }`}>
                        {user.isAdmin ? "ADMIN" : "USER"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[9px] text-gray-400">
                      {formatTimeAgo(user.createdAt)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAdmin(user.id, user.isAdmin)}
                          disabled={actionLoading === user.id}
                          className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 disabled:opacity-50 transition-colors ${
                            user.isAdmin
                              ? "bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100"
                              : "bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100"
                          }`}
                        >
                          {user.isAdmin ? "Quitar Admin" : "Hacer Admin"}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.username)}
                          disabled={actionLoading === user.id}
                          className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
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
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
