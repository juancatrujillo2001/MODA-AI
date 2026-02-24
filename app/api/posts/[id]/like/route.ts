import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// POST /api/posts/[id]/like — toggle like
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const postId = params.id;

    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.like.create({
      data: { userId: session.user.id, postId },
    });

    // Create notification for post owner
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (post && post.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "LIKE",
          message: `${session.user.username} liked your post`,
        },
      });
    }

    return NextResponse.json({ liked: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 });
  }
}
