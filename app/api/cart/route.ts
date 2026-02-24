import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { z } from "zod";

// GET /api/cart — list cart items
export async function GET() {
  try {
    const session = await requireSession();

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
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
    console.error("Cart error:", error);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

const addToCartSchema = z.object({
  garmentId: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  quantity: z.number().int().min(1).optional().default(1),
});

// POST /api/cart — add item to cart
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const result = addToCartSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { garmentId, size, color, quantity } = result.data;

    // Check if garment exists
    const garment = await prisma.garment.findUnique({
      where: { id: garmentId },
    });

    if (!garment) {
      return NextResponse.json({ error: "Garment not found" }, { status: 404 });
    }

    // Check if same item (garment + size + color) already in cart — increment quantity
    const existing = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        garmentId,
        size,
        color,
      },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: {
          garment: {
            include: {
              brand: { select: { id: true, name: true, logo: true } },
            },
          },
        },
      });
      return NextResponse.json(updated);
    }

    const item = await prisma.cartItem.create({
      data: {
        userId: session.user.id,
        garmentId,
        size,
        color,
        quantity,
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
    console.error("Add to cart error:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}
