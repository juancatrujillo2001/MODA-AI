import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// POST /api/setup — one-time admin creation (delete this file after use)
export async function POST() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: "trugrillo01@gmail.com" },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: "trugrillo01@gmail.com" },
        data: { isAdmin: true },
      });
      return NextResponse.json({
        message: "Usuario actualizado a ADMIN",
        username: existing.username,
      });
    }

    const hashed = await hash("Trujillo2001$", 12);

    const admin = await prisma.user.create({
      data: {
        fullName: "Admin Moda AI",
        username: "adminmodai",
        email: "trugrillo01@gmail.com",
        password: hashed,
        isAdmin: true,
        bio: "Administrador de Moda AI",
      },
    });

    return NextResponse.json({
      message: "Admin creado exitosamente",
      username: admin.username,
    }, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}
