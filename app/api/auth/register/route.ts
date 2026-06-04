import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Solicitud invalida." },
        { status: 400 }
      );
    }

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const msg = result.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const {
      fullName,
      email,
      username,
      password,
      gender,
      height,
      weight,
      bodyMeasurements,
      profilePhoto,
      avatar,
    } = result.data;

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    // Check existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Este email ya esta registrado" },
        { status: 409 }
      );
    }

    // Check existing username
    const existingUsername = await prisma.user.findUnique({
      where: { username: usernameLower },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Este nombre de usuario ya esta en uso" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: emailLower,
        username: usernameLower,
        password: hashedPassword,
        height: height || null,
        weight: weight || null,
        bodyMeasurements: bodyMeasurements || null,
        profilePhoto: profilePhoto || null,
        avatar: avatar || null,
        bio: gender ? `Gender: ${gender}` : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, username: user.username },
      },
      { status: 201 }
    );
  } catch (error) {
    const errMsg = (error as Error).message || "Unknown error";
    console.error("Registration error:", errMsg);

    if (errMsg.includes("Tenant or user not found")) {
      return NextResponse.json(
        { error: "Error de conexion a la base de datos. Intenta de nuevo." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la cuenta. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
