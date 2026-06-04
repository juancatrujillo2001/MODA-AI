import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  logo: z.string().url().optional().nullable().or(z.literal("")),
});

// PUT /api/admin/brands/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const body = await req.json();
    const result = updateBrandSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.brand.findUnique({
      where: { id: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (result.data.name && result.data.name !== existing.name) {
      const duplicate = await prisma.brand.findUnique({
        where: { name: result.data.name },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A brand with this name already exists" },
          { status: 409 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (result.data.name !== undefined) data.name = result.data.name;
    if (result.data.description !== undefined) data.description = result.data.description || null;
    if (result.data.logo !== undefined) data.logo = result.data.logo || null;

    const brand = await prisma.brand.update({
      where: { id: id },
      data,
      include: { _count: { select: { garments: true } } },
    });

    return NextResponse.json(brand);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin update brand error:", error);
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
  }
}

// DELETE /api/admin/brands/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const brand = await prisma.brand.findUnique({
      where: { id: id },
      select: { id: true, name: true },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    await prisma.brand.delete({ where: { id: id } });

    return NextResponse.json({ message: `Brand "${brand.name}" deleted` });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin delete brand error:", error);
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
  }
}
