import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/posts/trending — get trending/popular posts for explorer
export async function GET() {
  try {
    await requireSession();

    // Get posts ordered by engagement (likes count) from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        mediaUrl: true,
        mediaType: true,
        caption: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: {
        likes: { _count: "desc" },
      },
      take: 30,
    });

    // If not enough recent posts, fill with all posts
    if (posts.length < 10) {
      const allPosts = await prisma.post.findMany({
        select: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          caption: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return NextResponse.json(allPosts);
    }

    return NextResponse.json(posts);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Trending error:", error);
    return NextResponse.json(
      { error: "Failed to load trending" },
      { status: 500 }
    );
  }
}
