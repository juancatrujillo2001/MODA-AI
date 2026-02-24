import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  shippingName: z.string().min(1, "Name is required"),
  shippingAddress: z.string().min(1, "Address is required"),
  shippingCity: z.string().min(1, "City is required"),
  shippingCountry: z.string().min(1, "Country is required"),
  shippingZip: z.string().min(1, "ZIP code is required"),
});

// POST /api/checkout — create payment intent or mock order
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Fetch cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        garment: {
          include: { brand: { select: { name: true } } },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + Number(item.garment.price) * item.quantity;
    }, 0);

    const totalCents = Math.round(total * 100);

    // Build order items JSON
    const orderItems = cartItems.map((item) => ({
      garmentId: item.garment.id,
      name: item.garment.name,
      brand: item.garment.brand.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: Number(item.garment.price),
      photo: (item.garment.photos as string[])?.[0] || null,
    }));

    const shipping = result.data;
    const stripe = getStripe();

    if (stripe) {
      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "usd",
        metadata: {
          userId: session.user.id,
          shippingName: shipping.shippingName,
          shippingAddress: shipping.shippingAddress,
          shippingCity: shipping.shippingCity,
          shippingCountry: shipping.shippingCountry,
          shippingZip: shipping.shippingZip,
        },
      });

      // Create pending order
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          items: { items: orderItems, shipping },
          total: parseFloat(total.toFixed(2)),
          status: "PENDING",
          stripePaymentId: paymentIntent.id,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
        total,
      });
    }

    // Mock flow when Stripe is not configured
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        items: { items: orderItems, shipping },
        total: parseFloat(total.toFixed(2)),
        status: "PAID",
        stripePaymentId: `mock_${Date.now()}`,
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    });

    // Add purchased items to closet
    for (const item of cartItems) {
      await prisma.closetItem.upsert({
        where: {
          userId_garmentId: {
            userId: session.user.id,
            garmentId: item.garmentId,
          },
        },
        update: { source: "PURCHASED" },
        create: {
          userId: session.user.id,
          garmentId: item.garmentId,
          source: "PURCHASED",
        },
      });
    }

    return NextResponse.json({
      clientSecret: null,
      orderId: order.id,
      total,
      mockPayment: true,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
