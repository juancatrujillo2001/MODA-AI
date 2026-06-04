// TODO: Auth temporarily bypassed for development
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

const MOCK_SESSION = {
  user: {
    id: "demo-user-001",
    name: "María Demo",
    email: "maria@demo.com",
    username: "maria_demo",
    isAdmin: false,
    image: null,
  },
  expires: "2099-01-01T00:00:00.000Z",
};

export async function getSession() {
  return MOCK_SESSION;
}

export async function requireSession() {
  return MOCK_SESSION;
}
