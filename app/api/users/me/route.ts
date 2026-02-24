import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(300).optional(),
  profilePhoto: z.string().optional(),
  height: z.number().min(50).max(300).nullable().optional(),
  weight: z.number().min(20).max(500).nullable().optional(),
});

// GET /api/users/me — get current user data
export async function GET() {
  try {
    const session = await requireSession();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        bio: true,
        profilePhoto: true,
        avatar: true,
        height: true,
        weight: true,
        bodyMeasurements: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

// PATCH /api/users/me — update current user profile
export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;
    const updateData: Record<string, unknown> = {};

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.profilePhoto !== undefined) updateData.profilePhoto = data.profilePhoto || null;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        username: true,
        bio: true,
        profilePhoto: true,
        avatar: true,
        height: true,
        weight: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
