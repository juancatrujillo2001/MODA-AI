"use client";

import Image from "next/image";
import { HeartIcon, CommentIcon } from "@/components/icons";

interface GridPost {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  likesCount: number;
  commentsCount: number;
}

interface PostGridProps {
  posts: GridPost[];
  onPostClick: (postId: string) => void;
}

export function PostGrid({ posts, onPostClick }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 text-sm">No posts yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onPostClick(post.id)}
          className="relative aspect-square bg-gray-100 group"
        >
          <Image
            src={post.mediaUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 213px"
          />
          {post.mediaType === "VIDEO" && (
            <div className="absolute top-2 right-2">
              <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <span className="flex items-center gap-1 text-white text-sm font-semibold">
              <HeartIcon filled className="w-5 h-5" />
              {post.likesCount}
            </span>
            <span className="flex items-center gap-1 text-white text-sm font-semibold">
              <CommentIcon className="w-5 h-5" />
              {post.commentsCount}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
