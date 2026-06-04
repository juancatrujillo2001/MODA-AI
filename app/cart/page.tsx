"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { XIcon } from "@/components/icons";

interface CartItem {
  id: string;
  size: string;
  color: string;
  quantity: number;
  garment: {
    id: string;
    name: string;
    price: string;
    photos: unknown;
    brand: { id: string; name: string; logo: string | null };
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/cart");
      if (res.ok) setItems(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  async function updateQuantity(itemId: string, quantity: number) {
    setUpdatingId(itemId);
    const res = await fetch(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    }
    setUpdatingId(null);
  }

  async function removeItem(itemId: string) {
    const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.garment.price) * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-28 pt-2">
      <TopHeader />

      <main className="max-w-[600px] mx-auto px-4">
        {/* Page header */}
        <div className="flex items-center justify-between py-5 mb-2 mt-14">
          <h2 className="text-2xl font-black text-white tracking-tight">Mi carrito</h2>
          <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-500 text-xs font-semibold">
            {items.length} {items.length === 1 ? "artículo" : "artículos"}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span className="text-xs text-gray-600">Cargando carrito...</span>
          </div>
        ) : items.length === 0 ? (
          /* ─── Empty state ─── */
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            {/* Cart icon with glow */}
            <div className="relative">
              <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.1)]">
                <svg className="w-11 h-11 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-xl -z-10 scale-150" />
            </div>

            <p className="text-xl font-bold text-white text-center">Tu carrito está vacío</p>
            <p className="text-sm text-gray-600 text-center leading-relaxed max-w-[240px]">
              Descubre outfits y agrega prendas que te inspiren
            </p>

            <Link
              href="/search"
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 transition-all duration-200 active:scale-95 mt-2"
            >
              Explorar prendas →
            </Link>

            {/* Quick categories */}
            <div className="w-full mt-12 space-y-3">
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-gray-700 text-center mb-4">
                Empieza por aquí
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🔥", label: "Trending", href: "/search" },
                  { icon: "✦", label: "Streetwear", href: "/search?cat=streetwear" },
                  { icon: "🤍", label: "Minimal", href: "/search?cat=minimal" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center gap-2 p-4 bg-[#111118] border border-white/[0.07] rounded-2xl hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all duration-200"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-semibold text-gray-500">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Cart with items ─── */
          <>
            {/* Cart items */}
            <div className="space-y-3 mb-6">
              {items.map((item) => {
                const photos = item.garment.photos as string[];
                const photo = photos?.[0];
                const itemTotal = Number(item.garment.price) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-[#111118] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.12] transition-all duration-150"
                  >
                    {/* Photo */}
                    <div className="relative w-20 h-20 rounded-xl bg-[#16161f] flex-shrink-0 overflow-hidden">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={item.garment.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 2.25H8.25L4.5 6l2.25 1.5V21h10.5V7.5L19.5 6l-3.75-3.75z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {item.garment.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.garment.brand.name}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 active:scale-90"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Size & Color */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] bg-white/[0.05] border border-white/[0.08] text-gray-500 px-1.5 py-0.5 rounded-md font-medium">
                          {item.size}
                        </span>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full border border-white/10"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] text-gray-600">
                            {item.color}
                          </span>
                        </div>
                      </div>

                      {/* Quantity + Price */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-0">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={
                              item.quantity <= 1 || updatingId === item.id
                            }
                            className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all active:scale-90 text-sm font-bold disabled:opacity-30 disabled:hover:bg-white/[0.05] disabled:hover:text-gray-400"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-white w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={updatingId === item.id}
                            className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all active:scale-90 text-sm font-bold disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-bold text-white">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-5 space-y-4 mb-4">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-600">
                Resumen del pedido
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-semibold text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Envío</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">
                      GRATIS
                    </span>
                  </div>
                </div>
                <div className="border-t border-white/[0.06]" />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-bold text-white">Total</span>
                  <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Sticky checkout button */}
      {!loading && items.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <div className="max-w-[600px] mx-auto">
            <Link
              href="/checkout"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span>Ir a pagar</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 text-xs font-bold">
                ${subtotal.toFixed(2)}
              </span>
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
