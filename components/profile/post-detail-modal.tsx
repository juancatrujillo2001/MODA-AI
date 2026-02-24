"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { HeartIcon, CommentIcon, BookmarkIcon, XIcon, SendIcon } from "@/components/icons";
import { formatTimeAgo } from "@/lib/utils";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; username: string; profilePhoto: string | null; avatar: string | null };
}

interface PostDetailModalProps {
  postId: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption?: string | null;
  createdAt?: string;
  postUserId?: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function PostDetailModal({
  postId,
  mediaUrl,
  mediaType,
  caption,
  createdAt,
  postUserId,
  onClose,
  onDelete,
}: PostDetailModalProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = session?.user?.id === postUserId;

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/posts/${postId}/comment`);
      if (res.ok) setComments(await res.json());
      setLoading(false);
    }
    load();
  }, [postId]);

  async function handleLike() {
    setLiked(!liked);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
  }

  async function handleSave() {
    setSaved(!saved);
    await fetch(`/api/posts/${postId}/save`, { method: "POST" });
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = await fetch(`/api/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });

    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [...prev, c]);
      setCommentText("");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      onDelete?.();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-10"
      >
        <XIcon className="w-7 h-7" />
      </button>

      <div className="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row">
        {/* Media */}
        <div className="relative w-full md:w-1/2 aspect-square bg-black flex-shrink-0">
          {mediaType === "VIDEO" ? (
            <video src={mediaUrl} className="w-full h-full object-contain" controls />
          ) : (
            <Image src={mediaUrl} alt="" fill className="object-contain" sizes="50vw" />
          )}
        </div>

        {/* Details panel */}
        <div className="flex flex-col w-full md:w-1/2 max-h-[50vh] md:max-h-none">
          {/* Actions */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button onClick={handleLike}>
                <HeartIcon
                  filled={liked}
                  className={`w-6 h-6 ${liked ? "text-red-500" : "text-gray-700"}`}
                />
              </button>
              <CommentIcon className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex items-center gap-3">
              {isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-500 font-semibold"
                >
                  Delete
                </button>
              )}
              <button onClick={handleSave}>
                <BookmarkIcon
                  filled={saved}
                  className={`w-6 h-6 ${saved ? "text-gray-900" : "text-gray-700"}`}
                />
              </button>
            </div>
          </div>

          <div className="px-4 py-2 text-sm font-semibold">
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </div>

          {/* Caption */}
          {caption && (
            <div className="px-4 pb-2 text-sm text-gray-700">{caption}</div>
          )}

          {createdAt && (
            <div className="px-4 pb-2 text-xs text-gray-400">
              {formatTimeAgo(createdAt)}
            </div>
          )}

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 py-2 border-t border-gray-100 space-y-3">
            {loading ? (
              <p className="text-xs text-gray-400">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400">No comments yet</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <Link
                    href={`/profile/${c.user.username}`}
                    className="font-semibold mr-1"
                  >
                    {c.user.username}
                  </Link>
                  {c.text}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTimeAgo(c.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Comment input */}
          <form
            onSubmit={handleComment}
            className="flex items-center gap-2 px-4 py-3 border-t border-gray-200"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
            />
            {commentText.trim() && (
              <button type="submit" className="text-brand-500">
                <SendIcon />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <p className="font-semibold mb-2">Delete Post?</p>
            <p className="text-sm text-gray-500 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
