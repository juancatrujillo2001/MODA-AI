import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// DELETE /api/admin/posts/[id] — delete a post (moderation)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, caption: true, user: { select: { username: true } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Cascade delete handles likes, comments, saved posts
    await prisma.post.delete({ where: { id: params.id } });

    return NextResponse.json({
      message: `Post by @${post.user.username} deleted`,
    });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
