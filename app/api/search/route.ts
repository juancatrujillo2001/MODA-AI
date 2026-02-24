import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/search?q=&type=all|users|posts|brands
export async function GET(req: NextRequest) {
  try {
    await requireSession();

    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [], posts: [], brands: [] });
    }

    const results: {
      users?: unknown[];
      posts?: unknown[];
      brands?: unknown[];
    } = {};

    // Search users
    if (type === "all" || type === "users") {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { fullName: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePhoto: true,
          avatar: true,
          _count: { select: { followers: true } },
        },
        take: 20,
      });
    }

    // Search posts by caption
    if (type === "all" || type === "posts") {
      results.posts = await prisma.post.findMany({
        where: {
          OR: [
            { caption: { contains: query, mode: "insensitive" } },
            { aiDescription: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          caption: true,
          _count: { select: { likes: true, comments: true } },
          user: {
            select: {
              username: true,
              profilePhoto: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
    }

    // Search brands
    if (type === "all" || type === "brands") {
      results.brands = await prisma.brand.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          logo: true,
          description: true,
          _count: { select: { garments: true } },
        },
        take: 20,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
