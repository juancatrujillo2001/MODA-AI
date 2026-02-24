"use client";

import Link from "next/link";
import { BellIcon } from "@/components/icons";
import { useUnreadCount } from "@/lib/hooks/use-unread-count";
import { useCartCount } from "@/lib/hooks/use-cart-count";

export function TopHeader() {
  const { count } = useUnreadCount();
  const { count: cartCount } = useCartCount();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Subtle animal-print accent line */}
      <div className="h-0.5 bg-gradient-to-r from-brand-500/0 via-brand-500/30 to-brand-500/0" />
      <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold text-brand-500">Closet</h1>
        </Link>
        <div className="flex items-center gap-4">
          {/* Cart */}
          <Link href="/cart" className="relative btn-press">
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          {/* Notifications */}
          <Link href="/notifications" className="relative btn-press">
            <BellIcon className="w-6 h-6 text-gray-700" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
