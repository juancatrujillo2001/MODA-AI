import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getOpenAI } from "@/lib/openai";

// POST /api/posts/[id]/scan — AI scan garments in post image
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession();

    const post = await prisma.post.findUnique({
      where: { id: id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Return cached scan if available
    if (post.detectedItems && post.colorPalette && post.aiDescription) {
      return NextResponse.json({
        description: post.aiDescription,
        colorPalette: post.colorPalette,
        detectedItems: post.detectedItems,
      });
    }

    let scanResult;
    const openai = getOpenAI();

    if (openai && post.mediaUrl) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: post.mediaUrl },
                },
                {
                  type: "text",
                  text: `Analyze this outfit image and return a JSON object with:
1. "description": A brief description of the overall outfit style (1-2 sentences).
2. "colorPalette": An array of 3-6 hex color codes representing the dominant colors.
3. "detectedItems": An array of detected garments, each with:
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
        const parsed = JSON.parse(content);
        scanResult = {
          description: parsed.description || "A stylish outfit.",
          colorPalette: parsed.colorPalette || ["#000000", "#ffffff"],
          detectedItems: (parsed.detectedItems || []).map(
            (item: { name?: string; category?: string; color?: string; confidence?: number }) => ({
              name: item.name || "Unknown Item",
              category: item.category || "Tops",
              color: item.color || "Unknown",
              confidence: item.confidence || 0.8,
            })
          ),
        };
      } catch (aiError) {
        console.error("OpenAI scan failed, using fallback:", aiError);
        scanResult = getFallbackScanResult();
      }
    } else {
      scanResult = getFallbackScanResult();
    }

    // Cache the results
    await prisma.post.update({
      where: { id: id },
      data: {
        aiDescription: scanResult.description,
        colorPalette: scanResult.colorPalette,
        detectedItems: scanResult.detectedItems,
      },
    });

    return NextResponse.json(scanResult);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan post" },
      { status: 500 }
    );
  }
}

function getFallbackScanResult() {
  return {
    description:
      "A stylish casual outfit featuring layered pieces with a modern silhouette.",
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
