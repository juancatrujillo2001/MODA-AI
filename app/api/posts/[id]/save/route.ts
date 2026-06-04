import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// POST /api/posts/[id]/save — toggle save
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const postId = id;

    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedPost.create({
      data: { userId: session.user.id, postId },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
