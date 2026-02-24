import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const tryOnSchema = z.object({
  garmentIds: z.array(z.string()).min(1, "Select at least one garment"),
});

// POST /api/closet/outfit — generate virtual try-on
// Will use DALL-E when OpenAI key is configured
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

    // Fetch garments and user measurements
    const [garments, user] = await Promise.all([
      prisma.garment.findMany({
        where: { id: { in: result.data.garmentIds } },
        include: { brand: { select: { name: true } } },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { height: true, weight: true, bodyMeasurements: true },
      }),
    ]);

    if (garments.length === 0) {
      return NextResponse.json(
        { error: "No garments found" },
        { status: 404 }
      );
    }

    // TODO: Replace with DALL-E API call when OpenAI key is available
    // Build descriptive outfit summary for now
    const outfitDescription = garments
      .map(
        (g) =>
          `${g.name} by ${g.brand.name} (${g.category}, ${JSON.stringify(g.colors)})`
      )
      .join(", ");

    const response = {
      outfit: {
        garments: garments.map((g) => ({
          id: g.id,
          name: g.name,
          brand: g.brand.name,
          category: g.category,
          colors: g.colors,
          photos: g.photos,
        })),
        description: `Outfit combination: ${outfitDescription}`,
      },
      userMeasurements: {
        height: user?.height,
        weight: user?.weight,
      },
      // Placeholder images — will be replaced by DALL-E generated images
      frontView: null,
      backView: null,
      message:
        "Virtual try-on image generation requires an OpenAI API key. Configure OPENAI_API_KEY in .env to enable AI-generated outfit previews.",
    };

    return NextResponse.json(response);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Try-on error:", error);
    return NextResponse.json(
      { error: "Failed to generate outfit" },
      { status: 500 }
    );
  }
}
