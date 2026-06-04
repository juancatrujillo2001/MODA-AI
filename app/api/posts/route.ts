import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { z } from "zod";

// Allow large body for base64 images (up to 10MB)
export const runtime = "nodejs";
export const maxDuration = 30;

const createPostSchema = z.object({
  mediaUrl: z.string().min(1, "Image is required"),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  caption: z.string().max(2000).optional(),
  style: z.string().optional(),
  detectedItems: z.any().optional(),
  colorPalette: z.array(z.string()).optional(),
  aiDescription: z.string().optional(),
});

// Demo/mock posts for when database is unavailable
const MOCK_POSTS = [
      {
        id: "mock-1",
        userId: "demo-user-002",
        mediaUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
        mediaType: "IMAGE",
        caption: "Street style vibes in the city today. Loving this oversized blazer look!",
        aiDescription: "Elegant street style outfit featuring an oversized beige blazer, white tee, and high-waisted denim | Style: Street Chic",
        colorPalette: ["#D4B896", "#FFFFFF", "#4A6FA5", "#2C2C2C", "#E8D5C4"],
        detectedItems: [
          { name: "Oversized Blazer", category: "Outerwear", color: "#D4B896", confidence: 0.95, brand: "Zara" },
          { name: "White T-Shirt", category: "Tops", color: "#FFFFFF", confidence: 0.92, brand: "H&M" },
          { name: "High-Waisted Jeans", category: "Bottoms", color: "#4A6FA5", confidence: 0.89, brand: "Levi's" },
          { name: "White Sneakers", category: "Shoes", color: "#FFFFFF", confidence: 0.88, brand: "Nike" },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: { id: "demo-user-002", username: "sofia_style", fullName: "Sofia Martinez", profilePhoto: null, avatar: null },
        isLiked: false,
        isSaved: false,
        likesCount: 124,
        commentsCount: 18,
      },
      {
        id: "mock-2",
        userId: "demo-user-003",
        mediaUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
        mediaType: "IMAGE",
        caption: "Golden hour outfit check. This dress is everything!",
        aiDescription: "Stunning golden hour portrait with a flowing midi dress in warm tones, accessorized with minimal gold jewelry | Style: Romantic Chic",
        colorPalette: ["#C4956A", "#F5E6D3", "#8B6914", "#2D1B00", "#FFD700"],
        detectedItems: [
          { name: "Midi Dress", category: "Dresses", color: "#C4956A", confidence: 0.97, brand: "Mango" },
          { name: "Gold Necklace", category: "Accessories", color: "#FFD700", confidence: 0.85, brand: "Pandora" },
          { name: "Strappy Sandals", category: "Shoes", color: "#8B6914", confidence: 0.82 },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user: { id: "demo-user-003", username: "luna_fashion", fullName: "Luna Rivera", profilePhoto: null, avatar: null },
        isLiked: true,
        isSaved: false,
        likesCount: 287,
        commentsCount: 42,
      },
      {
        id: "mock-3",
        userId: "demo-user-004",
        mediaUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80",
        mediaType: "IMAGE",
        caption: "Monochrome mood. All black everything.",
        aiDescription: "Sleek all-black monochrome outfit with leather jacket and slim-fit trousers, creating a powerful minimalist look | Style: Dark Minimalist",
        colorPalette: ["#1A1A1A", "#2C2C2C", "#0D0D0D", "#333333", "#4A4A4A"],
        detectedItems: [
          { name: "Leather Jacket", category: "Outerwear", color: "#1A1A1A", confidence: 0.96, brand: "AllSaints" },
          { name: "Black T-Shirt", category: "Tops", color: "#2C2C2C", confidence: 0.93 },
          { name: "Slim Trousers", category: "Bottoms", color: "#0D0D0D", confidence: 0.91, brand: "COS" },
          { name: "Chelsea Boots", category: "Shoes", color: "#1A1A1A", confidence: 0.90, brand: "Dr. Martens" },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        user: { id: "demo-user-004", username: "carlos_noir", fullName: "Carlos Vega", profilePhoto: null, avatar: null },
        isLiked: false,
        isSaved: true,
        likesCount: 198,
        commentsCount: 27,
      },
      {
        id: "mock-4",
        userId: "demo-user-005",
        mediaUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
        mediaType: "IMAGE",
        caption: "Sunday brunch fit. Pastel palette for spring!",
        aiDescription: "Fresh spring look with pastel lavender blouse and white wide-leg pants, perfect for daytime outings | Style: Soft Feminine",
        colorPalette: ["#E6D5F2", "#FFFFFF", "#C9B8DB", "#F0E6F6", "#B8A9C9"],
        detectedItems: [
          { name: "Lavender Blouse", category: "Tops", color: "#E6D5F2", confidence: 0.94, brand: "& Other Stories" },
          { name: "Wide-Leg Pants", category: "Bottoms", color: "#FFFFFF", confidence: 0.91 },
          { name: "Straw Bag", category: "Accessories", color: "#C9B8DB", confidence: 0.78 },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        user: { id: "demo-user-005", username: "valentina_looks", fullName: "Valentina Cruz", profilePhoto: null, avatar: null },
        isLiked: false,
        isSaved: false,
        likesCount: 156,
        commentsCount: 21,
      },
      {
        id: "mock-5",
        userId: "demo-user-006",
        mediaUrl: "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&q=80",
        mediaType: "IMAGE",
        caption: "Denim on denim. Breaking the rules never looked so good.",
        aiDescription: "Bold double denim combination with a cropped jacket and straight-leg jeans, styled with vintage sunglasses | Style: Retro Casual",
        colorPalette: ["#5B8DB8", "#4A7BA7", "#6B9BC8", "#3D6E96", "#FFFFFF"],
        detectedItems: [
          { name: "Denim Jacket", category: "Outerwear", color: "#5B8DB8", confidence: 0.95, brand: "Levi's" },
          { name: "Straight-Leg Jeans", category: "Bottoms", color: "#4A7BA7", confidence: 0.92, brand: "Wrangler" },
          { name: "Vintage Sunglasses", category: "Accessories", color: "#3D6E96", confidence: 0.80, brand: "Ray-Ban" },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        user: { id: "demo-user-006", username: "diego_denim", fullName: "Diego Morales", profilePhoto: null, avatar: null },
        isLiked: true,
        isSaved: false,
        likesCount: 210,
        commentsCount: 33,
      },
];

// GET /api/posts — paginated feed
export async function GET(req: NextRequest) {
  // If no database URL, return demo posts directly
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ posts: MOCK_POSTS, nextCursor: undefined });
  }

  try {
    const session = await requireSession();
    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = 10;

    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    const posts = await prisma.post.findMany({
      where: followingIds.length > 0
        ? {
            OR: [
              { userId: { in: [...followingIds, session.user.id] } },
              ...(followingIds.length < 5 ? [{}] : []),
            ],
          }
        : {},
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            avatar: true,
          },
        },
        likes: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        savedBy: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const next = posts.pop();
      nextCursor = next?.id;
    }

    const formatted = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      isSaved: post.savedBy.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      likes: undefined,
      savedBy: undefined,
      _count: undefined,
    }));

    if (formatted.length === 0) {
      return NextResponse.json({ posts: MOCK_POSTS, nextCursor: undefined });
    }

    return NextResponse.json({ posts: formatted, nextCursor });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Feed error:", error);
    return NextResponse.json({ posts: MOCK_POSTS, nextCursor: undefined });
  }
}

// POST /api/posts — create a new post
export async function POST(req: Request) {
  try {
    const session = await requireSession();

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. The image may be too large — try a smaller photo." },
        { status: 400 }
      );
    }

    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json(
        { error: `Validation error: ${messages}` },
        { status: 400 }
      );
    }

    const { mediaUrl, mediaType, caption, style, aiDescription, colorPalette, detectedItems } = result.data;

    // Build caption with style tag if provided
    const fullCaption = caption || null;

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        mediaUrl,
        mediaType,
        caption: fullCaption,
        aiDescription: [aiDescription, style ? `Style: ${style}` : null].filter(Boolean).join(" | ") || null,
        colorPalette: colorPalette && colorPalette.length > 0 ? colorPalette : undefined,
        detectedItems: detectedItems && detectedItems.length > 0 ? detectedItems : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const errMsg = (error as Error).message || "Unknown error";
    console.error("Create post error:", errMsg, error);

    // Provide specific messages for known issues
    if (errMsg.includes("Unique constraint")) {
      return NextResponse.json({ error: "This post already exists." }, { status: 409 });
    }
    if (errMsg.includes("Tenant or user not found")) {
      return NextResponse.json({ error: "Database connection error. Please try again." }, { status: 503 });
    }
    if (errMsg.includes("value too long") || errMsg.includes("StringTooLong")) {
      return NextResponse.json({ error: "Image is too large. Please use a smaller photo (under 5MB)." }, { status: 413 });
    }

    return NextResponse.json(
      { error: `Failed to create post: ${errMsg.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
