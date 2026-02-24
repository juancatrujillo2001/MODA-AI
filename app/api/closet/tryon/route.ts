import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateTryOn } from "@/lib/vertex-tryon";
import { z } from "zod";

const tryOnSchema = z.object({
  garmentId: z.string().min(1, "Garment ID is required"),
});

// POST /api/closet/tryon — generate virtual try-on image
// Uses Google Vertex AI virtual-try-on-001 model
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const result = tryOnSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { garmentId } = result.data;

    // Check cache first
    const cached = await prisma.tryOnResult.findUnique({
      where: {
        userId_garmentId: {
          userId: session.user.id,
          garmentId,
        },
      },
    });

    if (cached) {
      return NextResponse.json({
        image: cached.resultImage,
        isPlaceholder: false,
        cached: true,
      });
    }

    // Fetch user photo and garment photo
    const [user, garment] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { profilePhoto: true, avatar: true },
      }),
      prisma.garment.findUnique({
        where: { id: garmentId },
        select: { photos: true, name: true, category: true },
      }),
    ]);

    if (!garment) {
      return NextResponse.json(
        { error: "Garment not found" },
        { status: 404 }
      );
    }

    const personImage = user?.profilePhoto || user?.avatar;
    if (!personImage) {
      return NextResponse.json(
        { error: "Please upload a profile photo first to use virtual try-on" },
        { status: 400 }
      );
    }

    const garmentPhotos = garment.photos as string[];
    const garmentImage = garmentPhotos?.[0];
    if (!garmentImage) {
      return NextResponse.json(
        { error: "Garment has no photo available" },
        { status: 400 }
      );
    }

    // Generate try-on image via Vertex AI
    const tryOnResult = await generateTryOn(personImage, garmentImage);

    // Cache result in DB if it's a real generated image (not placeholder)
    if (!tryOnResult.isPlaceholder) {
      await prisma.tryOnResult.upsert({
        where: {
          userId_garmentId: {
            userId: session.user.id,
            garmentId,
          },
        },
        update: { resultImage: tryOnResult.image },
        create: {
          userId: session.user.id,
          garmentId,
          resultImage: tryOnResult.image,
        },
      });
    }

    return NextResponse.json({
      image: tryOnResult.image,
      isPlaceholder: tryOnResult.isPlaceholder,
      cached: false,
      garment: {
        name: garment.name,
        category: garment.category,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Try-on error:", error);
    return NextResponse.json(
      { error: "Failed to generate try-on" },
      { status: 500 }
    );
  }
}
