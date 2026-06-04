import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
});

// GET /api/admin/brands?search=
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || "";

    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const brands = await prisma.brand.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { garments: true } },
      },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin brands error:", error);
    return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
  }
}

// POST /api/admin/brands
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const result = createBrandSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.brand.findUnique({
      where: { name: result.data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A brand with this name already exists" },
        { status: 409 }
      );
    }

    const brand = await prisma.brand.create({
      data: {
        name: result.data.name,
        description: result.data.description || null,
        logo: result.data.logo || null,
      },
      include: { _count: { select: { garments: true } } },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin create brand error:", error);
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
  }
}
