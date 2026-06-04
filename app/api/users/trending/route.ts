import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/users/trending — users with most followers
export async function GET() {
  try {
    await requireSession();

    const users = await prisma.user.findMany({
      orderBy: { followers: { _count: "desc" } },
      select: {
        id: true,
        username: true,
        fullName: true,
        profilePhoto: true,
        avatar: true,
        _count: { select: { followers: true, posts: true } },
      },
      take: 20,
    });

    return NextResponse.json(users);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Trending users error:", error);
    return NextResponse.json([]);
  }
}
