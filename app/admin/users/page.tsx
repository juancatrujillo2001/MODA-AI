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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isAdmin: !currentAdmin } : u
        )
      );
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Failed to update user");
    }
    setActionLoading(null);
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Delete user @${username}? This will permanently remove all their data.`)) {
      return;
    }

    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTotal((t) => t - 1);
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Failed to delete user");
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Users ({total})</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 w-64"
          />
          <button
            type="submit"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Email</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-5 py-3">Posts</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-5 py-3">Followers</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-5 py-3">Closet</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Joined</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 overflow-hidden">
                          {user.profilePhoto || user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profilePhoto || user.avatar!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.fullName}</p>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-600">{user._count.posts}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-600">{user._count.followers}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-600">{user._count.closetItems}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        user.isAdmin
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {formatTimeAgo(user.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAdmin(user.id, user.isAdmin)}
                          disabled={actionLoading === user.id}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg disabled:opacity-50 ${
                            user.isAdmin
                              ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                              : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                          }`}
                        >
                          {user.isAdmin ? "Revoke Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.username)}
                          disabled={actionLoading === user.id}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
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
    </div>
  );
}
