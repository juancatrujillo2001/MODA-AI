"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  HeartIcon,
  CommentIcon,
  BookmarkIcon,
  ShirtIcon,
  ScannerIcon,
  SendIcon,
} from "@/components/icons";
import { GarmentDrawer } from "@/components/feed/garment-drawer";
import { formatTimeAgo } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────── */
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
  user: {
    id: string;
    username: string;
    profilePhoto: string | null;
    avatar: string | null;
  };
}

interface DetectedItem {
  name: string;
  category: string;
  color: string;
  confidence: number;
  brand?: string;
  brandId?: string;
  garmentId?: string;
  price?: number;
  imageUrl?: string;
}

export interface PostData {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  aiDescription: string | null;
  colorPalette: string[] | null;
  detectedItems: DetectedItem[] | null;
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

/* ─── Hanger placeholder for items without image ─────── */
function HangerPlaceholder({ size = "w-14 h-14" }: { size?: string }) {
  return (
    <div className={`${size} bg-[#16161f] rounded-lg flex items-center justify-center flex-shrink-0`}>
      <svg className="w-1/2 h-1/2 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M12 3a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.73V8l7 5H4l7-5V6.73A2 2 0 0 1 12 3z"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ─── Item image or placeholder ──────────────────────── */
function ItemImage({ item }: { item: DetectedItem }) {
  if (item.imageUrl) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return <HangerPlaceholder size="w-10 h-10" />;
}

/* ─── Component ──────────────────────────────────────── */
export function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();

  /* Existing states */
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  /* New states */
  const [showDrawer, setShowDrawer] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [itemStates, setItemStates] = useState<
    Record<number, { saved?: boolean; carted?: boolean; loading?: string }>
  >({});
  const [savingAll, setSavingAll] = useState(false);
  const [allSaved, setAllSaved] = useState(false);

  const isOwner = session?.user?.id === post.userId;
  const items: DetectedItem[] = (post.detectedItems as DetectedItem[]) || [];
  const colors: string[] = (post.colorPalette as string[]) || [];
  const hasAiData = !!post.aiDescription || items.length > 0;

  const styleParts = post.aiDescription?.split(" | Style: ") || [];
  const aiDesc = styleParts[0] || null;
  const outfitStyle = styleParts[1] || null;

  /* ─── Existing handlers ──────────────────────────── */
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
    const res = await fetch(`/api/users/${post.userId}/follow`, { method: "POST" });
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

  /* ─── Garment drawer handlers ────────────────────── */
  function openDrawer() {
    if (flipped) setFlipped(false);
    setShowDrawer(true);
  }

  function toggleFlip() {
    setFlipped((v) => !v);
  }

  async function handleItemSave(item: DetectedItem, index: number) {
    setItemStates((s) => ({ ...s, [index]: { ...s[index], loading: "save" } }));
    try {
      const body = item.garmentId
        ? { garmentId: item.garmentId, source: "SAVED" }
        : {
            name: item.name,
            brand: item.brand || "Unknown",
            category: item.category,
            colors: [item.color],
            source: "SAVED",
          };
      const res = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok || res.status === 409) {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], saved: true, loading: undefined },
        }));
      } else {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], loading: undefined },
        }));
      }
    } catch {
      setItemStates((s) => ({
        ...s,
        [index]: { ...s[index], loading: undefined },
      }));
    }
  }

  async function handleItemCart(item: DetectedItem, index: number) {
    setItemStates((s) => ({ ...s, [index]: { ...s[index], loading: "cart" } }));
    try {
      let garmentId = item.garmentId;
      if (!garmentId) {
        const closetRes = await fetch("/api/closet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            brand: item.brand || "Unknown",
            category: item.category,
            colors: [item.color],
            source: "SAVED",
          }),
        });
        if (closetRes.ok) {
          const closetData = await closetRes.json();
          garmentId = closetData.garmentId || closetData.garment?.id;
        } else if (closetRes.status === 409) {
          setItemStates((s) => ({
            ...s,
            [index]: { ...s[index], carted: true, saved: true, loading: undefined },
          }));
          return;
        }
      }
      if (!garmentId) {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], loading: undefined },
        }));
        return;
      }
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId, size: "M", color: item.color, quantity: 1 }),
      });
      if (res.ok) {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], carted: true, saved: true, loading: undefined },
        }));
      } else {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], loading: undefined },
        }));
      }
    } catch {
      setItemStates((s) => ({
        ...s,
        [index]: { ...s[index], loading: undefined },
      }));
    }
  }

  async function handleSaveAllItems() {
    if (items.length === 0) return;
    setSavingAll(true);
    for (let i = 0; i < items.length; i++) {
      const state = itemStates[i];
      if (state?.saved) continue;
      await handleItemSave(items[i], i);
    }
    setSavingAll(false);
    setAllSaved(true);
  }

  const profileImg = post.user.profilePhoto || post.user.avatar;

  return (
    <article
      className="bg-[#111118] border border-white/[0.07] rounded-[20px] overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:shadow-[0_8px_50px_rgba(168,85,247,0.15)] transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.username}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-500/20 ring-offset-2 ring-offset-[#111118] flex-shrink-0 overflow-hidden">
              {profileImg ? (
                <Image
                  src={profileImg}
                  alt={post.user.username}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-bold">
                  {post.user.fullName[0]}
                </span>
              )}
            </div>
          </Link>
          <Link
            href={`/profile/${post.user.username}`}
            className="text-sm font-semibold text-white tracking-tight"
          >
            {post.user.username}
          </Link>
        </div>
        {!isOwner && (
          <button
            onClick={handleFollow}
            className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
              isFollowing
                ? "text-gray-400 bg-white/[0.05] border border-white/[0.07]"
                : "text-purple-400 bg-purple-500/[0.1] border border-purple-500/20 hover:bg-purple-500/[0.15]"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* ─── Media ─── */}
      <div>
        {/* Photo / Card Flip */}
        <div className="card-flip-container relative w-full aspect-square md:aspect-[4/5] bg-[#0a0a0f] overflow-hidden flex-shrink-0">
          <div className={`card-flip-inner w-full h-full ${flipped ? "flipped" : ""}`}>
            {/* ─── FRONT FACE ─── */}
            <div className="card-face w-full h-full">
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
                  sizes="(max-width: 768px) 100vw, 468px"
                />
              )}
            </div>

            {/* ─── BACK FACE (AI Analysis) ─── */}
            <div className="card-face card-back w-full h-full bg-[#0a0a0f] text-white overflow-y-auto">
              {hasAiData ? (
                <div className="flex flex-col h-full p-5">
                  {/* Style badge */}
                  <div className="text-center pt-4 pb-5">
                    {outfitStyle && (
                      <span className="inline-block text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full mb-3">
                        {outfitStyle}
                      </span>
                    )}
                    {!outfitStyle && aiDesc && (
                      <span className="inline-block text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full mb-3">
                        Outfit analizado
                      </span>
                    )}
                    <p className="text-3xl font-black text-white">
                      9.2<span className="text-sm font-medium text-white/50">/10</span>
                    </p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                      Style score
                    </p>
                  </div>

                  <div className="border-t border-white/[0.07]" />

                  {/* Color Palette */}
                  <div className="py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">
                      Paleta de colores
                    </p>
                    <div className="flex gap-3 justify-center">
                      {(colors.length > 0
                        ? colors.slice(0, 5)
                        : ["#333", "#666", "#999", "#ccc", "#fff"]
                      ).map((color, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            className="w-9 h-9 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[8px] text-white/30 uppercase">
                            {color}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.07]" />

                  {/* Detected items with images */}
                  <div className="py-4 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">
                      Prendas detectadas
                    </p>
                    {items.length > 0 ? (
                      <div className="space-y-2.5">
                        {items.slice(0, 4).map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <ItemImage item={item} />
                            <div>
                              <p className="text-xs font-semibold text-white/90">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-white/40">
                                {item.category}
                                {item.brand ? ` · ${item.brand}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                        {items.length > 4 && (
                          <p className="text-[10px] text-white/30 uppercase tracking-wide pl-[52px]">
                            +{items.length - 4} mas
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-white/30">Sin prendas detectadas</p>
                    )}
                  </div>

                  {aiDesc && (
                    <>
                      <div className="border-t border-white/[0.07]" />
                      <p className="text-xs text-white/50 leading-relaxed py-3 line-clamp-3">
                        {aiDesc}
                      </p>
                    </>
                  )}

                  <button
                    onClick={() => setFlipped(false)}
                    className="w-full py-3 mt-auto text-xs font-semibold text-white border border-white/[0.12] rounded-lg hover:bg-white/[0.05] transition-colors uppercase tracking-wide"
                  >
                    Ver foto
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <ScannerIcon className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-sm font-semibold text-white/50 mb-1">
                    Analisis no disponible
                  </p>
                  <p className="text-xs text-white/30 text-center mb-6">
                    Este post no tiene datos de escaneo AI
                  </p>
                  <button
                    onClick={() => setFlipped(false)}
                    className="px-6 py-2.5 text-xs font-semibold text-white border border-white/[0.12] rounded-lg hover:bg-white/[0.05] transition-colors uppercase tracking-wide"
                  >
                    Ver foto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-all duration-150 p-2 rounded-xl hover:bg-white/[0.05] active:scale-90"
          >
            <HeartIcon
              filled={liked}
              className={`w-6 h-6 ${liked ? "text-pink-500 fill-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]" : ""}`}
            />
          </button>
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-all duration-150 p-2 rounded-xl hover:bg-white/[0.05] active:scale-90"
          >
            <CommentIcon className="w-6 h-6" />
          </button>
          <button
            onClick={openDrawer}
            className={`flex items-center gap-1.5 transition-all duration-150 p-2 rounded-xl hover:bg-white/[0.05] active:scale-90 ${
              showDrawer ? "text-purple-400" : "text-gray-500 hover:text-white"
            }`}
          >
            <ShirtIcon className="w-6 h-6" />
            {items.length > 0 && (
              <span className="text-[10px] font-bold text-gray-600">{items.length}</span>
            )}
          </button>
          <button
            onClick={toggleFlip}
            className={`flex items-center gap-1.5 transition-all duration-150 p-2 rounded-xl hover:bg-white/[0.05] active:scale-90 ${
              flipped ? "text-purple-400" : "text-gray-500 hover:text-white"
            }`}
          >
            <ScannerIcon className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={handleSave}
          className="text-gray-500 hover:text-purple-400 transition-all duration-150 p-2 rounded-xl hover:bg-purple-500/[0.08] active:scale-90"
        >
          <BookmarkIcon
            filled={saved}
            className={`w-6 h-6 ${saved ? "text-purple-400" : ""}`}
          />
        </button>
      </div>

      {/* Likes count */}
      <div className="px-4 pt-1">
        <p className="text-sm font-semibold text-white">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-1">
          <p className="text-sm text-gray-400 leading-relaxed">
            <Link
              href={`/profile/${post.user.username}`}
              className="font-semibold text-white mr-1"
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
          className="px-4 pb-2 text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          View all {post.commentsCount} comments
        </button>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-2">
          {loadingComments ? (
            <p className="text-xs text-gray-600">Loading comments...</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <p key={c.id} className="text-sm text-gray-400">
                  <Link
                    href={`/profile/${c.user.username}`}
                    className="font-semibold text-white mr-1"
                  >
                    {c.user.username}
                  </Link>
                  {c.text}
                </p>
              ))}
            </div>
          )}
          <form
            onSubmit={handleComment}
            className="flex items-center gap-2 mt-2 border-t border-white/[0.04] pt-2"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-600 text-gray-300"
            />
            {commentText.trim() && (
              <button type="submit" className="text-purple-400 hover:text-purple-300 transition-colors">
                <SendIcon className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 pb-3">
        <p className="text-[11px] uppercase tracking-widest text-gray-600 font-medium">
          {formatTimeAgo(post.createdAt)}
        </p>
      </div>

      {/* Garment Drawer */}
      <GarmentDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        items={items}
        itemStates={itemStates}
        postImage={post.mediaUrl}
        username={post.user.username}
        onSaveItem={handleItemSave}
        onCartItem={handleItemCart}
        onSaveAll={handleSaveAllItems}
        savingAll={savingAll}
        allSaved={allSaved}
      />
    </article>
  );
}
