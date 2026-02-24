import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | Closet",
  description: "Your latest notifications and activity updates.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
