import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  if (!session.user.isAdmin) {
    throw new Error("Forbidden");
  }
  return session;
}
