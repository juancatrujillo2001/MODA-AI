"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PostGrid } from "@/components/profile/post-grid";
import { PostDetailModal } from "@/components/profile/post-detail-modal";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";

interface ProfilePost {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  createdAt: string;
  _count?: { likes: number; comments: number };
  likesCount?: number;
  commentsCount?: number;
}

interface ProfileData {
  id: string;
  fullName: string;
  username: string;
  bio: string | null;
  profilePhoto: string | null;
  avatar: string | null;
  height: number | null;
  weight: number | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwner: boolean;
  posts: ProfilePost[];
}

export default function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [savedPosts, setSavedPosts] = useState<ProfilePost[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch(`/api/users/profile/${params.username}`);
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setIsFollowing(data.isFollowing);
    } else {
      router.push("/feed");
    }
    setLoading(false);
  }, [params.username, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function loadSavedPosts() {
    if (savedLoaded) return;
    const res = await fetch("/api/users/me/saved");
    if (res.ok) {
      const data = await res.json();
      setSavedPosts(data);
    }
    setSavedLoaded(true);
  }

  async function handleFollow() {
    if (!profile) return;
    const prev = isFollowing;
    setIsFollowing(!isFollowing);
    setProfile((p) =>
      p
        ? {
            ...p,
            followersCount: prev
              ? p.followersCount - 1
              : p.followersCount + 1,
          }
        : p
    );

    const res = await fetch(`/api/users/${profile.id}/follow`, {
      method: "POST",
    });
    if (!res.ok) {
      setIsFollowing(prev);
      setProfile((p) =>
        p
          ? {
              ...p,
              followersCount: prev
                ? p.followersCount
                : p.followersCount - 1,
            }
          : p
      );
    }
  }

  function handleTabChange(tab: "posts" | "saved") {
    setActiveTab(tab);
    if (tab === "saved" && !savedLoaded) loadSavedPosts();
  }

  function handlePostDeleted() {
    setProfile((p) =>
      p
        ? {
            ...p,
            postsCount: p.postsCount - 1,
            posts: p.posts.filter((post) => post.id !== selectedPostId),
          }
        : p
    );
    setSelectedPostId(null);
  }

  const selectedPost = profile?.posts.find((p) => p.id === selectedPostId);
  const selectedSavedPost = savedPosts.find((p) => p.id === selectedPostId);
  const modalPost = selectedPost || selectedSavedPost;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const profileImg = profile.profilePhoto || profile.avatar;

  const gridPosts = (activeTab === "posts" ? profile.posts : savedPosts).map(
    (p) => ({
      id: p.id,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      likesCount: p._count?.likes ?? p.likesCount ?? 0,
      commentsCount: p._count?.comments ?? p.commentsCount ?? 0,
    })
  );

  return (
    <div className="min-h-screen bg-white pb-16">
      <TopHeader />

      <main className="max-w-screen-md mx-auto">
        {/* Profile header */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-6 md:gap-10">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {profileImg ? (
                <Image
                  src={profileImg}
                  alt={profile.username}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {profile.fullName[0]}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-semibold">{profile.username}</h2>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold">{profile.postsCount}</p>
                  <p className="text-gray-500">posts</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{profile.followersCount}</p>
                  <p className="text-gray-500">followers</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{profile.followingCount}</p>
                  <p className="text-gray-500">following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Name & bio */}
          <div className="mt-4">
            <p className="font-semibold text-sm">{profile.fullName}</p>
            {profile.bio && (
              <p className="text-sm text-gray-700 mt-1">{profile.bio}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            {profile.isOwner ? (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex-1 py-1.5 bg-gray-100 text-sm font-semibold rounded-lg hover:bg-gray-200"
                >
                  Edit profile
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="px-4 py-1.5 bg-gray-100 text-sm font-semibold rounded-lg hover:bg-gray-200 text-gray-500"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={handleFollow}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg ${
                  isFollowing
                    ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    : "bg-brand-500 text-white hover:bg-brand-600"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => handleTabChange("posts")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 ${
              activeTab === "posts"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400"
            }`}
          >
            <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          {profile.isOwner && (
            <button
              onClick={() => handleTabChange("saved")}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 ${
                activeTab === "saved"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400"
              }`}
            >
              <BookmarkTabIcon />
            </button>
          )}
        </div>

        {/* Post grid */}
        <PostGrid posts={gridPosts} onPostClick={setSelectedPostId} />
      </main>

      <BottomNav />

      {/* Post detail modal */}
      {modalPost && selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          mediaUrl={modalPost.mediaUrl}
          mediaType={modalPost.mediaType}
          caption={modalPost.caption}
          createdAt={modalPost.createdAt}
          postUserId={profile.id}
          onClose={() => setSelectedPostId(null)}
          onDelete={profile.isOwner ? handlePostDeleted : undefined}
        />
      )}

      {/* Edit profile modal */}
      {showEditModal && (
        <EditProfileModal
          user={profile}
          onClose={() => setShowEditModal(false)}
          onSave={fetchProfile}
        />
      )}
    </div>
  );
}

function BookmarkTabIcon() {
  return (
    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}
