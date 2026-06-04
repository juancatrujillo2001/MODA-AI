"use client";

import Link from "next/link";
import { BellIcon } from "@/components/icons";
import { useUnreadCount } from "@/lib/hooks/use-unread-count";
import { useCartCount } from "@/lib/hooks/use-cart-count";

export function TopHeader() {
  const { count } = useUnreadCount();
  const { count: cartCount } = useCartCount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,10,15,0.85)] backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-[468px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-1.5">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Closet
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link href="/cart" className="relative text-gray-500 hover:text-white transition-colors duration-150 p-2 rounded-xl hover:bg-white/[0.05]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          {/* Notifications */}
          <Link href="/notifications" className="relative text-gray-500 hover:text-white transition-colors duration-150 p-2 rounded-xl hover:bg-white/[0.05]">
            <BellIcon className="w-6 h-6" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
