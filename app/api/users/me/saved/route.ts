import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/users/me/saved — get saved posts
export async function GET() {
  try {
    const session = await requireSession();

    const saved = await prisma.savedPost.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            caption: true,
            createdAt: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });

    const posts = saved.map((s) => ({
      ...s.post,
      likesCount: s.post._count.likes,
      commentsCount: s.post._count.comments,
      _count: undefined,
    }));

    return NextResponse.json(posts);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load saved posts" },
      { status: 500 }
    );
  }
}
