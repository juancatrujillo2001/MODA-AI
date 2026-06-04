import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  brandId: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  sizes: z.array(z.string()).min(1, "At least one size is required"),
  colors: z.array(z.string()).min(1, "At least one color is required"),
  price: z.number().positive("Price must be positive"),
  description: z.string().max(1000).optional(),
  photos: z.array(z.string()).min(1, "At least one photo is required"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().int().min(0).default(0),
});

// GET /api/admin/products?brandId=&search=&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const brandId = searchParams.get("brandId") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (brandId) where.brandId = brandId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.garment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          brand: { select: { id: true, name: true } },
        },
      }),
      prisma.garment.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin products error:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findUnique({
      where: { id: result.data.brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const existingSku = await prisma.garment.findUnique({
      where: { sku: result.data.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 409 }
      );
    }

    const product = await prisma.garment.create({
      data: {
        name: result.data.name,
        brandId: result.data.brandId,
        category: result.data.category,
        subcategory: result.data.subcategory || null,
        sizes: result.data.sizes,
        colors: result.data.colors,
        price: result.data.price,
        description: result.data.description || null,
        photos: result.data.photos,
        sku: result.data.sku,
        stock: result.data.stock,
      },
      include: { brand: { select: { id: true, name: true } } },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
