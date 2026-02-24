"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { formatTimeAgo } from "@/lib/utils";

interface OrderItem {
  garmentId: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  photo: string | null;
}

interface Order {
  id: string;
  total: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  stripePaymentId: string | null;
  items: {
    items: OrderItem[];
    shipping: {
      shippingName: string;
      shippingAddress: string;
      shippingCity: string;
      shippingCountry: string;
      shippingZip: string;
    };
  };
}

const STATUS_CONFIG: Record<string, { style: string; label: string; icon: string }> = {
  PENDING: { style: "bg-yellow-100 text-yellow-700", label: "Payment Pending", icon: "clock" },
  PAID: { style: "bg-green-100 text-green-700", label: "Paid", icon: "check" },
  SHIPPED: { style: "bg-blue-100 text-blue-700", label: "Shipped", icon: "truck" },
  DELIVERED: { style: "bg-emerald-100 text-emerald-700", label: "Delivered", icon: "check-double" },
  CANCELLED: { style: "bg-red-100 text-red-700", label: "Cancelled", icon: "x" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) setOrder(await res.json());
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopHeader />
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopHeader />
        <div className="text-center py-20">
          <p className="text-gray-500">Order not found</p>
          <Link href="/orders" className="text-sm text-brand-500 mt-2 inline-block">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const isPaid = order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <TopHeader />

      <main className="max-w-screen-md mx-auto px-4">
        {/* Back link */}
        <div className="py-3">
          <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; My Orders
          </Link>
        </div>

        {/* Success banner */}
        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-green-800 mb-1">
              Thank you for your order!
            </h2>
            <p className="text-sm text-green-600">
              Your order has been confirmed and is being processed.
            </p>
          </div>
        )}

        {/* Order header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold">
                Order #{order.id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-xs text-gray-400">
                {formatTimeAgo(order.createdAt)}
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.style}`}>
              {statusConfig.label}
            </span>
          </div>

          {order.stripePaymentId && (
            <p className="text-[11px] text-gray-400">
              Payment ID: {order.stripePaymentId}
            </p>
          )}
        </div>

        {/* Order items */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">
            Items ({order.items.items.length})
          </h3>
          <div className="space-y-3">
            {order.items.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {item.photo ? (
                    <Image
                      src={item.photo}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.brand} &middot; {item.size} &middot;{" "}
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full border border-gray-200 align-middle"
                      style={{ backgroundColor: item.color }}
                    />{" "}
                    &middot; Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium flex-shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-3 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping info */}
        {order.items.shipping && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-semibold mb-2">Shipping Address</h3>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium">{order.items.shipping.shippingName}</p>
              <p>{order.items.shipping.shippingAddress}</p>
              <p>
                {order.items.shipping.shippingCity},{" "}
                {order.items.shipping.shippingZip}
              </p>
              <p>{order.items.shipping.shippingCountry}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/orders"
            className="flex-1 py-3 bg-gray-100 text-center text-sm font-semibold rounded-xl hover:bg-gray-200"
          >
            View All Orders
          </Link>
          <Link
            href="/closet"
            className="flex-1 py-3 bg-brand-500 text-white text-center text-sm font-semibold rounded-xl hover:bg-brand-600"
          >
            Go to Closet
          </Link>
        </div>
      </main>
    </div>
  );
}
