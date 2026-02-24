import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/webhooks/stripe — handle Stripe webhook events
export async function POST(req: Request) {
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 400 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // Find and update the order
    const order = await prisma.order.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      // Clear the user's cart
      await prisma.cartItem.deleteMany({
        where: { userId: order.userId },
      });

      // Add purchased items to closet
      const orderData = order.items as { items: { garmentId: string }[] };
      for (const item of orderData.items) {
        await prisma.closetItem.upsert({
          where: {
            userId_garmentId: {
              userId: order.userId,
              garmentId: item.garmentId,
            },
          },
          update: { source: "PURCHASED" },
          create: {
            userId: order.userId,
            garmentId: item.garmentId,
            source: "PURCHASED",
          },
        });
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    await prisma.order.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json({ received: true });
}
