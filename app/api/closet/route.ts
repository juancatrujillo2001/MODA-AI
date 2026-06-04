import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { z } from "zod";

// GET /api/closet?source=SAVED|PURCHASED&category=Shirts|Jeans|...
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = req.nextUrl;
    const source = searchParams.get("source") as "SAVED" | "PURCHASED" | null;
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (source) where.source = source;

    const garmentWhere: Record<string, unknown> = {};
    if (category) garmentWhere.category = category;

    const items = await prisma.closetItem.findMany({
      where: {
        ...where,
        garment: Object.keys(garmentWhere).length > 0 ? garmentWhere : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        garment: {
          include: {
            brand: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Closet error:", error);
    return NextResponse.json([]);
  }
}

// Schema for adding an existing garment by ID
const addByIdSchema = z.object({
  garmentId: z.string().min(1),
  source: z.enum(["SAVED", "PURCHASED"]),
});

// Schema for manually adding a new garment
const addManualSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(100),
  category: z.string().min(1),
  sizes: z.array(z.string()).optional().default([]),
  colors: z.array(z.string()).optional().default([]),
  price: z.number().min(0).optional().default(0),
  photoUrl: z.string().nullable().optional(),
  source: z.enum(["SAVED", "PURCHASED"]),
});

// POST /api/closet — add item to closet
// Supports two modes:
// 1. By garmentId: { garmentId, source } — adds existing garment
// 2. Manual: { name, brand, category, sizes, colors, price, photoUrl, source } — creates garment then adds
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();

    // Try adding by garment ID first
    if (body.garmentId) {
      const result = addByIdSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 }
        );
      }

      const existing = await prisma.closetItem.findUnique({
        where: {
          userId_garmentId: {
            userId: session.user.id,
            garmentId: result.data.garmentId,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Item already in closet" },
          { status: 409 }
        );
      }

      const item = await prisma.closetItem.create({
        data: {
          userId: session.user.id,
          garmentId: result.data.garmentId,
          source: result.data.source,
        },
        include: {
          garment: {
            include: {
              brand: { select: { id: true, name: true, logo: true } },
            },
          },
        },
      });

      return NextResponse.json(item, { status: 201 });
    }

    // Manual add: create brand + garment + closet item
    const result = addManualSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, brand: brandName, category, sizes, colors, price, photoUrl, source } =
      result.data;

    // Find or create brand
    let brand = await prisma.brand.findUnique({
      where: { name: brandName },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: brandName },
      });
    }

    // Create garment with a generated SKU
    const sku = `MANUAL-${session.user.id.slice(-6)}-${Date.now()}`;
    const garment = await prisma.garment.create({
      data: {
        name,
        brandId: brand.id,
        category,
        sizes: sizes,
        colors: colors,
        price: price,
        photos: photoUrl ? [photoUrl] : [],
        sku,
      },
    });

    // Add to closet
    const item = await prisma.closetItem.create({
      data: {
        userId: session.user.id,
        garmentId: garment.id,
        source,
      },
      include: {
        garment: {
          include: {
            brand: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Add to closet error:", error);
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    );
  }
}
