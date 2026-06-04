import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/users/profile/[username] — get user profile
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getSession();
    const currentUserId = session?.user?.id;

    const user = await prisma.user.findUnique({
      where: { username: username },
      select: {
        id: true,
        fullName: true,
        username: true,
        bio: true,
        profilePhoto: true,
        avatar: true,
        height: true,
        weight: true,
        createdAt: true,
        posts: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            caption: true,
            createdAt: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      ...user,
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      isOwner: currentUserId === user.id,
      _count: undefined,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
