import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// GET /api/brands — public brands list
export async function GET() {
  try {
    await requireSession();

    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        logo: true,
        description: true,
        _count: { select: { garments: true } },
      },
      take: 20,
    });

    return NextResponse.json(brands);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Brands error:", error);
    return NextResponse.json([]);
  }
}
