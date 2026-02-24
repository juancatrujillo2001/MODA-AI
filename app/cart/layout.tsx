import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart | Closet",
  description: "Review your shopping cart before checkout.",
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
