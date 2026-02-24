import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getOpenAI } from "@/lib/openai";
import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(chatMessageSchema).optional().default([]),
});

// POST /api/closet/chat — AI fashion assistant
// Uses OpenAI GPT when key is configured, falls back to smart placeholder responses
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const result = chatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Fetch user's closet and profile for context
    const [closetItems, user] = await Promise.all([
      prisma.closetItem.findMany({
        where: { userId: session.user.id },
        include: {
          garment: {
            include: { brand: { select: { name: true } } },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { height: true, weight: true, fullName: true, bio: true },
      }),
    ]);

    const openai = getOpenAI();

    if (openai) {
      // Build closet context for the AI
      const closetSummary =
        closetItems.length > 0
          ? closetItems
              .map(
                (item) =>
                  `- ${item.garment.name} by ${item.garment.brand.name} (${item.garment.category}, colors: ${JSON.stringify(item.garment.colors)}, source: ${item.source})`
              )
              .join("\n")
          : "User's closet is empty.";

      const userProfile = [
        user?.fullName ? `Name: ${user.fullName}` : null,
        user?.height ? `Height: ${user.height}cm` : null,
        user?.weight ? `Weight: ${user.weight}kg` : null,
        user?.bio ? `Bio: ${user.bio}` : null,
      ]
        .filter(Boolean)
        .join(", ");

      const systemPrompt = `You are a professional fashion stylist AI assistant integrated into a virtual closet app. You help users create outfit combinations, suggest missing wardrobe pieces, and give personalized style advice.

User Profile: ${userProfile || "No profile info available."}

User's Closet (${closetItems.length} items):
${closetSummary}

Guidelines:
- Give specific outfit recommendations using items from the user's actual closet
- Consider the user's body measurements when giving advice
- Suggest specific brands and items they could add to complement their wardrobe
- Be encouraging and positive about their style choices
- Keep responses concise but helpful (2-4 paragraphs max)
- Use bullet points for outfit combinations
- If they ask about trends, provide current fashion advice`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history for continuity
      for (const msg of result.data.history) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }

      messages.push({ role: "user", content: result.data.message });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply =
        completion.choices[0]?.message?.content ||
        "I couldn't generate a response. Please try again.";

      return NextResponse.json({ reply, closetSize: closetItems.length });
    }

    // Fallback: smart placeholder responses when no OpenAI key
    const reply = generatePlaceholderReply(
      result.data.message,
      closetItems,
      user
    );

    return NextResponse.json({ reply, closetSize: closetItems.length });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}

interface ClosetItemWithGarment {
  garment: {
    name: string;
    category: string;
    brand: { name: string };
    colors: unknown;
  };
  source: string;
}

type UserProfile = {
  height: number | null;
  weight: number | null;
  fullName: string;
} | null;

function generatePlaceholderReply(
  message: string,
  closetItems: ClosetItemWithGarment[],
  user: UserProfile
): string {
  const msg = message.toLowerCase();

  if (closetItems.length === 0) {
    return "Your closet is empty! Start by saving garments from posts or purchasing items from the store. Once you have some items, I can help you create amazing outfit combinations.";
  }

  if (msg.includes("outfit") || msg.includes("wear") || msg.includes("combination")) {
    const categories = Array.from(new Set(closetItems.map((i) => i.garment.category)));
    const brands = Array.from(new Set(closetItems.map((i) => i.garment.brand.name)));

    let reply = `Based on your closet with ${closetItems.length} items across categories: ${categories.join(", ")}. `;
    reply += `You have pieces from ${brands.join(", ")}. `;

    if (categories.includes("Shirts") && categories.includes("Jeans")) {
      const top = closetItems.find((i) => i.garment.category === "Shirts");
      const bottom = closetItems.find((i) => i.garment.category === "Jeans");
      if (top && bottom) {
        reply += `\n\nTry pairing your **${top.garment.name}** with your **${bottom.garment.name}** for a clean, casual look!`;
      }
    } else if (categories.includes("Tops") && categories.includes("Bottoms")) {
      const top = closetItems.find((i) => i.garment.category === "Tops");
      const bottom = closetItems.find((i) => i.garment.category === "Bottoms");
      if (top && bottom) {
        reply += `\n\nTry pairing your **${top.garment.name}** with your **${bottom.garment.name}** for a clean look!`;
      }
    } else {
      reply += "\n\nI'd suggest adding more variety to your wardrobe. A mix of tops and bottoms will give you more outfit options.";
    }
    return reply;
  }

  if (msg.includes("missing") || msg.includes("need") || msg.includes("buy")) {
    const categories = closetItems.map((i) => i.garment.category);
    const missing = ["Shirts", "Jeans", "Shoes", "Accessories", "Jackets"].filter(
      (c) => !categories.includes(c)
    );

    if (missing.length > 0) {
      return `Your closet is missing: **${missing.join(", ")}**. Adding these categories would give you more versatile outfit options!`;
    }
    return "Your closet has great variety! Consider adding seasonal pieces or trend items to keep your wardrobe fresh.";
  }

  if (msg.includes("style") || msg.includes("advice") || msg.includes("tip")) {
    let reply = `Here are some styling tips${user?.height ? ` for your height (${user.height}cm)` : ""}:\n\n`;
    reply += "- Layer different textures for visual depth\n";
    reply += "- Use accessories to elevate simple outfits\n";
    reply += "- Stick to a 3-color max per outfit for a cohesive look\n";
    reply += "- Invest in quality basics that mix and match well";
    return reply;
  }

  let reply = "I'm your fashion assistant! I can help you with:\n\n";
  reply += "- **Outfit combinations** from your closet\n";
  reply += "- **Style advice** based on your body type\n";
  reply += "- **Missing pieces** to complete your wardrobe\n";
  reply += "- **Trend recommendations**\n\n";
  reply += "What would you like help with?";
  return reply;
}
