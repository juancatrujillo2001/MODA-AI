import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
});

// PATCH /api/admin/users/[id] — update user (toggle admin, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    const body = await req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (result.data.isAdmin === false && id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove your own admin privileges" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: id },
      data: result.data,
      select: {
        id: true,
        fullName: true,
        username: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — delete user and all their data
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAdmin();

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cascade delete handles all related data
    await prisma.user.delete({ where: { id: id } });

    return NextResponse.json({ message: `User ${user.username} deleted` });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
