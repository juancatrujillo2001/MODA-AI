import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// POST /api/posts/[id]/scan — AI scan garments in post image
// Returns cached results if already scanned, otherwise generates mock data
// Will integrate OpenAI Vision when API key is configured
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
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

    // TODO: Replace with OpenAI Vision API call when key is available
    // For now, return placeholder data to demonstrate UI
    const scanResult = {
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

    // Cache the results
    await prisma.post.update({
      where: { id: params.id },
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
