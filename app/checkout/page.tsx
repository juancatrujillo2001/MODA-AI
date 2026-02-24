"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { StripeCheckoutForm } from "@/components/checkout/stripe-form";

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
    brand: { name: string };
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipping form
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingZip, setShippingZip] = useState("");

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mockPayment, setMockPayment] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          router.push("/cart");
          return;
        }
        setItems(data);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.garment.price) * item.quantity,
    0
  );

  async function handleCreatePaymentIntent() {
    if (!shippingName || !shippingAddress || !shippingCity || !shippingCountry || !shippingZip) {
      setError("Please fill in all shipping fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingName,
          shippingAddress,
          shippingCity,
          shippingCountry,
          shippingZip,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setSubmitting(false);
        return;
      }

      if (data.mockPayment) {
        // No Stripe configured — mock payment succeeded
        setMockPayment(true);
        setOrderId(data.orderId);
        router.push(`/orders/${data.orderId}`);
        return;
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setSubmitting(false);
    } catch {
      setError("Connection error. Please try again.");
      setSubmitting(false);
    }
  }

  function handlePaymentSuccess() {
    if (orderId) {
      router.push(`/orders/${orderId}`);
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <TopHeader />

      <main className="max-w-screen-md mx-auto px-4">
        {/* Back link */}
        <div className="py-3">
          <Link href="/cart" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to cart
          </Link>
        </div>

        <h2 className="text-lg font-bold mb-4">Checkout</h2>

        <div className="space-y-4">
          {/* Order summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3">
              Order Summary ({items.length} items)
            </h3>
            <div className="space-y-2 mb-3">
              {items.map((item) => {
                const photos = item.garment.photos as string[];
                const photo = photos?.[0];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={item.garment.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.garment.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.size} &middot; Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      ${(Number(item.garment.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping form */}
          {!clientSecret && !mockPayment && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold mb-3">Shipping Address</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="Full name"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street address"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="City"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={shippingZip}
                    onChange={(e) => setShippingZip(e.target.value)}
                    placeholder="ZIP code"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <input
                  type="text"
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  placeholder="Country"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {error && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreatePaymentIntent}
                disabled={submitting}
                className="w-full mt-4 py-3 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? "Processing..." : `Pay $${subtotal.toFixed(2)}`}
              </button>
            </div>
          )}

          {/* Stripe payment form */}
          {clientSecret && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold mb-3">Payment Details</h3>
              <StripeCheckoutForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
