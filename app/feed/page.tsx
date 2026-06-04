"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PostCard, PostData } from "@/components/feed/post-card";

export default function FeedPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(
    async (nextCursor?: string) => {
      const url = nextCursor
        ? `/api/posts?cursor=${nextCursor}`
        : "/api/posts";

      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      setPosts((prev) =>
        nextCursor ? [...prev, ...data.posts] : data.posts
      );
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && cursor) {
          fetchPosts(cursor);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading, cursor, fetchPosts]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-14 pb-24">
      <TopHeader />

      <main className="max-w-[468px] mx-auto px-0 py-4 space-y-4">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4 animate-fade-in">
            <div className="w-20 h-20 bg-[#16161f] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-500/30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Your feed is empty</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Follow people to see their posts here, or create your first post to share with the community.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/search"
                className="text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] btn-press"
              >
                Find People
              </Link>
              <Link
                href="/create"
                className="text-sm font-medium text-gray-400 hover:text-white px-5 py-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors"
              >
                Create Post
              </Link>
            </div>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-10" />

            {!hasMore && posts.length > 0 && (
              <p className="text-center text-[13px] text-gray-700 tracking-widest uppercase py-10">
                You&apos;re all caught up
              </p>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
