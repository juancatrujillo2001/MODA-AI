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
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopHeader />

      <main className="max-w-screen-md mx-auto">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold">Shopping Cart</h2>
          <p className="text-sm text-gray-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">Your cart is empty</p>
            <p className="text-sm text-gray-400 mb-4">
              Browse garments and add them to your cart
            </p>
            <Link
              href="/search"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Explore items
            </Link>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="px-4 space-y-3 mb-4">
              {items.map((item) => {
                const photos = item.garment.photos as string[];
                const photo = photos?.[0];
                const itemTotal = Number(item.garment.price) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-200 p-3 flex gap-3"
                  >
                    {/* Photo */}
                    <div className="relative w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={item.garment.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 2.25H8.25L4.5 6l2.25 1.5V21h10.5V7.5L19.5 6l-3.75-3.75z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {item.garment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.garment.brand.name}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                          {item.size}
                        </span>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] text-gray-500">
                            {item.color}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg">
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
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={updatingId === item.id}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="mx-4 bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h3 className="text-sm font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout button */}
            <div className="px-4">
              <Link
                href="/checkout"
                className="block w-full py-3 bg-brand-500 text-white text-center text-sm font-semibold rounded-xl hover:bg-brand-600"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
