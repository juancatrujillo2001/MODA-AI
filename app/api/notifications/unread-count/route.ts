import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/notifications/unread-count — lightweight endpoint for badge
export async function GET() {
  try {
    const session = await requireSession();

    const count = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });

    return NextResponse.json({ count });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ count: 0 });
  }
}
