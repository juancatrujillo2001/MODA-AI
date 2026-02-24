"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  HomeIcon,
  SearchIcon,
  PlusSquareIcon,
  ClosetIcon,
  UserIcon,
} from "@/components/icons";

const navItems = [
  { href: "/feed", label: "Home", icon: HomeIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/create", label: "Create", icon: PlusSquareIcon },
  { href: "/closet", label: "Closet", icon: ClosetIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-screen-md mx-auto flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-colors btn-press ${
                isActive ? "text-brand-500" : "text-gray-400"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-brand-500 rounded-b-full" />
              )}
              <item.icon
                filled={isActive && "filled" in item.icon ? true : undefined}
                className="w-6 h-6"
              />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={`/profile/${session?.user?.username || ""}`}
          className={`relative flex flex-col items-center justify-center w-full h-full transition-colors btn-press ${
            pathname.startsWith("/profile") ? "text-brand-500" : "text-gray-400"
          }`}
        >
          {pathname.startsWith("/profile") && (
            <div className="absolute top-0 w-8 h-0.5 bg-brand-500 rounded-b-full" />
          )}
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-0.5">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
