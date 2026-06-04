import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { hash } from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "trugrillo01@gmail.com" },
  });

  if (existing) {
    await prisma.user.update({
      where: { email: "trugrillo01@gmail.com" },
      data: { isAdmin: true },
    });
    console.log("Usuario actualizado a ADMIN:", existing.username);
    return;
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
  console.log("Admin creado exitosamente:", admin.username);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
