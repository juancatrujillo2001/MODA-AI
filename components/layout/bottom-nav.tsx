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
  { href: "/create", label: "Create", icon: PlusSquareIcon, isCreate: true },
  { href: "/closet", label: "Closet", icon: ClosetIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[rgba(10,10,15,0.92)] backdrop-blur-xl border-t border-white/[0.06] shadow-[0_-4px_30px_rgba(0,0,0,0.3)] safe-area-bottom">
      <div className="max-w-[468px] mx-auto flex items-center justify-around px-2 py-2 h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          if (item.isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 w-16 h-12"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-95 transition-all duration-150">
                  <svg className="text-white w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-colors duration-150 ${
                isActive
                  ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <item.icon
                filled={isActive && "filled" in item.icon ? true : undefined}
                className="w-6 h-6"
              />
              <span className={`text-[10px] font-medium ${isActive ? "text-purple-400" : "text-gray-600"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <Link
          href={`/profile/${session?.user?.username || ""}`}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-colors duration-150 ${
            pathname.startsWith("/profile")
              ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
              : "text-gray-600 hover:text-gray-400"
          }`}
        >
          <UserIcon className="w-6 h-6" />
          <span className={`text-[10px] font-medium ${pathname.startsWith("/profile") ? "text-purple-400" : "text-gray-600"}`}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
