import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Closet | Closet",
  description: "Manage your virtual wardrobe. Try on outfits and get AI styling advice.",
};

export default function ClosetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
