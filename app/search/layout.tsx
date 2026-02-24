import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search | Closet",
  description: "Search for users, posts, and brands on Closet.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
