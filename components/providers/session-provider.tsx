"use client";

// TODO: Auth temporarily bypassed for development
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

const mockSession = {
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

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider session={mockSession}>
      {children}
    </NextAuthSessionProvider>
  );
}
