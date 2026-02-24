"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { formatTimeAgo } from "@/lib/utils";

interface Order {
  id: string;
  total: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  items: { items: { name: string; quantity: number }[] };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopHeader />

      <main className="max-w-screen-md mx-auto">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold">My Orders</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">No orders yet</p>
            <p className="text-sm text-gray-400">
              Your order history will appear here
            </p>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {orders.map((order) => {
              const itemCount =
                order.items?.items?.reduce(
                  (sum: number, i: { quantity: number }) => sum + i.quantity,
                  0
                ) || 0;
              const itemNames =
                order.items?.items
                  ?.map((i: { name: string }) => i.name)
                  .slice(0, 2)
                  .join(", ") || "Items";

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[order.status] || STATUS_STYLES.PENDING
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {itemNames}
                    {(order.items?.items?.length || 0) > 2 && " ..."}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                    <p className="text-sm font-bold">
                      ${Number(order.total).toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
