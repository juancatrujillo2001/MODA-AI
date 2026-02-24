import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getOpenAI } from "@/lib/openai";
import { z } from "zod";

const scanSchema = z.object({
  imageBase64: z.string().min(1),
});

interface DetectedItem {
  name: string;
  category: string;
  color: string;
  confidence: number;
  brand?: string;
  brandId?: string;
  garmentId?: string;
}

// POST /api/scan — Pre-publish AI scan of an outfit image
export async function POST(req: Request) {
  try {
    await requireSession();
    const body = await req.json();
    const result = scanSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { imageBase64 } = result.data;
    const openai = getOpenAI();

    if (!openai) {
      // Fallback: return placeholder data when no API key
      return NextResponse.json(getFallbackScanResult());
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
            {
              type: "text",
              text: `Analyze this outfit image and return a JSON object with:
1. "description": A brief description of the overall outfit style (1-2 sentences).
2. "suggestedCaption": A fun, engaging social media caption for this outfit (include relevant emojis, keep under 200 chars).
3. "colorPalette": An array of 3-6 hex color codes representing the dominant colors in the outfit.
4. "detectedItems": An array of detected garments, each with:
   - "name": Garment name (e.g. "Slim Fit Jeans")
   - "category": One of: Tops, Bottoms, Outerwear, Shoes, Accessories, Dresses, Activewear
   - "color": Primary color name
   - "confidence": Detection confidence 0.0-1.0
   - "brand": Estimated brand name if recognizable, or null

Return ONLY valid JSON, no markdown or explanation.`,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If parsing fails, return fallback
      return NextResponse.json(getFallbackScanResult());
    }

    const detectedItems: DetectedItem[] = await Promise.all(
      (parsed.detectedItems || []).map(async (item: DetectedItem) => {
        const result: DetectedItem = {
          name: item.name || "Unknown Item",
          category: item.category || "Tops",
          color: item.color || "Unknown",
          confidence: item.confidence || 0.8,
        };

        // Try to match brand against DB
        if (item.brand) {
          const brand = await prisma.brand.findFirst({
            where: { name: { equals: item.brand, mode: "insensitive" } },
            include: {
              garments: {
                where: {
                  category: { equals: item.category, mode: "insensitive" },
                },
                take: 1,
              },
            },
          });

          if (brand) {
            result.brand = brand.name;
            result.brandId = brand.id;
            if (brand.garments.length > 0) {
              result.garmentId = brand.garments[0].id;
            }
          } else {
            result.brand = item.brand;
          }
        }

        return result;
      })
    );

    return NextResponse.json({
      description: parsed.description || "A stylish outfit.",
      suggestedCaption: parsed.suggestedCaption || "",
      colorPalette: parsed.colorPalette || ["#000000", "#ffffff"],
      detectedItems,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan image" },
      { status: 500 }
    );
  }
}

function getFallbackScanResult() {
  return {
    description:
      "A stylish casual outfit featuring layered pieces with a modern silhouette.",
    suggestedCaption: "Serving looks today! What do you think of this fit?",
    colorPalette: ["#1a1a2e", "#16213e", "#e2e2e2", "#f5f5dc", "#8b4513"],
    detectedItems: [
      {
        name: "Cotton T-Shirt",
        category: "Tops",
        color: "White",
        confidence: 0.92,
      },
      {
        name: "Denim Jacket",
        category: "Outerwear",
        color: "Blue",
        confidence: 0.88,
      },
      {
        name: "Slim Fit Jeans",
        category: "Bottoms",
        color: "Dark Blue",
        confidence: 0.85,
      },
      {
        name: "Sneakers",
        category: "Shoes",
        color: "White",
        confidence: 0.9,
      },
    ],
  };
}
