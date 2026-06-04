import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brandId: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional().nullable(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  price: z.number().positive().optional(),
  description: z.string().max(1000).optional().nullable(),
  photos: z.array(z.string()).optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0).optional(),
});

// PUT /api/admin/products/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const body = await req.json();
    const result = updateProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.garment.findUnique({
      where: { id: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (result.data.sku && result.data.sku !== existing.sku) {
      const duplicate = await prisma.garment.findUnique({
        where: { sku: result.data.sku },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A product with this SKU already exists" },
          { status: 409 }
        );
      }
    }

    if (result.data.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: result.data.brandId },
      });
      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
    }

    const product = await prisma.garment.update({
      where: { id: id },
      data: result.data,
      include: { brand: { select: { id: true, name: true } } },
    });

    return NextResponse.json(product);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin update product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const product = await prisma.garment.findUnique({
      where: { id: id },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.garment.delete({ where: { id: id } });

    return NextResponse.json({ message: `Product "${product.name}" deleted` });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin delete product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
