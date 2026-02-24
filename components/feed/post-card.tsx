"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { HeartIcon, CommentIcon, BookmarkIcon, ShirtIcon, SendIcon } from "@/components/icons";
import { ScannerPanel } from "@/components/feed/scanner-panel";
import { formatTimeAgo } from "@/lib/utils";

interface PostUser {
  id: string;
  username: string;
  fullName: string;
  profilePhoto: string | null;
  avatar: string | null;
}

interface Comment {
  id: string;
  text: string;
  user: { id: string; username: string; profilePhoto: string | null; avatar: string | null };
}

export interface PostData {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  createdAt: string;
  user: PostUser;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  commentsCount: number;
}

interface PostCardProps {
  post: PostData;
}

export function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const isOwner = session?.user?.id === post.userId;

  async function handleLike() {
    const prev = liked;
    setLiked(!liked);
    setLikesCount((c) => (liked ? c - 1 : c + 1));

    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) {
      setLiked(prev);
      setLikesCount((c) => (prev ? c : c - 1));
    }
  }

  async function handleSave() {
    const prev = saved;
    setSaved(!saved);

    const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    if (!res.ok) setSaved(prev);
  }

  async function handleFollow() {
    const prev = isFollowing;
    setIsFollowing(!isFollowing);

    const res = await fetch(`/api/users/${post.userId}/follow`, {
      method: "POST",
    });
    if (!res.ok) setIsFollowing(prev);
  }

  async function loadComments() {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }
    setLoadingComments(true);
    setShowComments(true);
    const res = await fetch(`/api/posts/${post.id}/comment`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
    setLoadingComments(false);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = await fetch(`/api/posts/${post.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    }
  }

  const profileImg = post.user.profilePhoto || post.user.avatar;

  return (
    <article className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.username}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              {profileImg ? (
                <Image
                  src={profileImg}
                  alt={post.user.username}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {post.user.fullName[0]}
                </div>
              )}
            </div>
          </Link>
          <Link
            href={`/profile/${post.user.username}`}
            className="text-sm font-semibold text-gray-900"
          >
            {post.user.username}
          </Link>
        </div>
        {!isOwner && (
          <button
            onClick={handleFollow}
            className={`text-xs font-semibold px-3 py-1 rounded ${
              isFollowing
                ? "text-gray-700 bg-gray-100"
                : "text-brand-500 bg-brand-50 hover:bg-brand-100"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Media */}
      <div className="relative w-full aspect-square bg-gray-100">
        {post.mediaType === "VIDEO" ? (
          <video
            src={post.mediaUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        ) : (
          <Image
            src={post.mediaUrl}
            alt={post.caption || "Post"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="active:scale-90 transition-transform">
            <HeartIcon
              filled={liked}
              className={`w-6 h-6 ${liked ? "text-red-500" : "text-gray-700"}`}
            />
          </button>
          <button onClick={loadComments} className="active:scale-90 transition-transform">
            <CommentIcon className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="active:scale-90 transition-transform"
          >
            <ShirtIcon
              className={`w-6 h-6 ${showScanner ? "text-brand-500" : "text-gray-700"}`}
            />
          </button>
        </div>
        <button onClick={handleSave} className="active:scale-90 transition-transform">
          <BookmarkIcon
            filled={saved}
            className={`w-6 h-6 ${saved ? "text-gray-900" : "text-gray-700"}`}
          />
        </button>
      </div>

      {/* Likes count */}
      <div className="px-4 pb-1">
        <p className="text-sm font-semibold">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-2">
          <p className="text-sm">
            <Link
              href={`/profile/${post.user.username}`}
              className="font-semibold mr-1"
            >
              {post.user.username}
            </Link>
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments count */}
      {post.commentsCount > 0 && !showComments && (
        <button
          onClick={loadComments}
          className="px-4 pb-2 text-sm text-gray-500"
        >
          View all {post.commentsCount} comments
        </button>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-2">
          {loadingComments ? (
            <p className="text-xs text-gray-400">Loading comments...</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <p key={c.id} className="text-sm">
                  <Link
                    href={`/profile/${c.user.username}`}
                    className="font-semibold mr-1"
                  >
                    {c.user.username}
                  </Link>
                  {c.text}
                </p>
              ))}
            </div>
          )}
          <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-400"
            />
            {commentText.trim() && (
              <button type="submit" className="text-brand-500">
                <SendIcon className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-400 uppercase">
          {formatTimeAgo(post.createdAt)}
        </p>
      </div>

      {/* AI Scanner Panel */}
      {showScanner && (
        <ScannerPanel postId={post.id} onClose={() => setShowScanner(false)} />
      )}
    </article>
  );
}
