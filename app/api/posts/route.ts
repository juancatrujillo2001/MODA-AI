import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createPostSchema = z.object({
  mediaUrl: z.string().min(1),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  caption: z.string().optional(),
});

// GET /api/posts — paginated feed
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = 10;

    // Get IDs of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    const posts = await prisma.post.findMany({
      where: followingIds.length > 0
        ? {
            OR: [
              { userId: { in: [...followingIds, session.user.id] } },
              // Include trending posts (any post) if following few people
              ...(followingIds.length < 5 ? [{}] : []),
            ],
          }
        : {}, // Show all posts if not following anyone (discovery mode)
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            avatar: true,
          },
        },
        likes: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        savedBy: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const next = posts.pop();
      nextCursor = next?.id;
    }

    const formatted = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      isSaved: post.savedBy.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      likes: undefined,
      savedBy: undefined,
      _count: undefined,
    }));

    return NextResponse.json({ posts: formatted, nextCursor });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}

// POST /api/posts — create a new post
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        mediaUrl: result.data.mediaUrl,
        mediaType: result.data.mediaType,
        caption: result.data.caption || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
