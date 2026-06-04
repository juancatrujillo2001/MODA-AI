import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(500),
});

// GET /api/posts/[id]/comment — get comments
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Failed to load comments" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comment — add comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const body = await req.json();
    const result = commentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        postId: id,
        text: result.data.text,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true,
            avatar: true,
          },
        },
      },
    });

    // Notify post owner
    const post = await prisma.post.findUnique({
      where: { id: id },
      select: { userId: true },
    });

    if (post && post.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "COMMENT",
          message: `${session.user.username} commented on your post`,
        },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
