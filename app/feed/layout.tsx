import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed | Closet",
  description: "Discover and share fashion outfits with your community.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
