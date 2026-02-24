import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// GET /api/admin/stats — dashboard statistics
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalBrands,
      totalGarments,
      usersToday,
      postsToday,
      usersThisWeek,
      postsThisWeek,
      totalLikes,
      totalComments,
      totalNotifications,
      recentUsers,
      recentPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.brand.count(),
      prisma.garment.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.post.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.like.count(),
      prisma.comment.count(),
      prisma.notification.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          createdAt: true,
          profilePhoto: true,
        },
      }),
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          caption: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
          user: { select: { username: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totals: {
        users: totalUsers,
        posts: totalPosts,
        brands: totalBrands,
        garments: totalGarments,
        likes: totalLikes,
        comments: totalComments,
        notifications: totalNotifications,
      },
      today: { users: usersToday, posts: postsToday },
      thisWeek: { users: usersThisWeek, posts: postsThisWeek },
      recentUsers,
      recentPosts,
    });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
