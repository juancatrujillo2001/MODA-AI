"use client";

import { useState, useEffect, useCallback } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { GarmentCard } from "@/components/closet/garment-card";
import { TryOnPanel } from "@/components/closet/try-on-panel";
import { ChatPanel } from "@/components/closet/chat-panel";
import { AddItemModal } from "@/components/closet/add-item-modal";

interface ClosetItem {
  id: string;
  source: "SAVED" | "PURCHASED";
  garment: {
    id: string;
    name: string;
    category: string;
    subcategory: string | null;
    colors: unknown;
    sizes: unknown;
    photos: unknown;
    price: string;
    brand: { id: string; name: string; logo: string | null };
  };
}

const CATEGORIES = [
  "All",
  "Shirts",
  "Jeans",
  "Shoes",
  "Accessories",
  "Jackets",
];

type SourceTab = "all" | "SAVED" | "PURCHASED";

export default function ClosetPage() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tryOnMode, setTryOnMode] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const fetchCloset = useCallback(async () => {
    const params = new URLSearchParams();
    if (sourceTab !== "all") params.set("source", sourceTab);
    if (category !== "All") params.set("category", category);

    const res = await fetch(`/api/closet?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [sourceTab, category]);

  useEffect(() => {
    setLoading(true);
    fetchCloset();
  }, [fetchCloset]);

  function toggleSelect(garmentId: string) {
    setSelectedId((prev) => (prev === garmentId ? null : garmentId));
  }

  async function handleRemove(itemId: string) {
    const res = await fetch(`/api/closet/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  }

  const selectedGarment = selectedId
    ? items.find((i) => i.garment.id === selectedId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopHeader />

      <main className="max-w-screen-md mx-auto">
        {/* Header bar */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">My Closet</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddItem(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              + Add
            </button>
            <button
              onClick={() => {
                setTryOnMode(!tryOnMode);
                if (tryOnMode) setSelectedId(null);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                tryOnMode
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tryOnMode ? "Cancel" : "Try On"}
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"
            >
              AI Stylist
            </button>
          </div>
        </div>

        {/* Source tabs */}
        <div className="px-4 flex gap-1 mb-3">
          {(
            [
              { label: "All", value: "all" },
              { label: "Saved", value: "SAVED" },
              { label: "Purchased", value: "PURCHASED" },
            ] as { label: string; value: SourceTab }[]
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSourceTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sourceTab === tab.value
                  ? "bg-brand-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="px-4 mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  category === cat
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Try-on mode banner */}
        {tryOnMode && (
          <div className="mx-4 mb-4 bg-brand-50 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-brand-700">
              Select a garment to try on
              {selectedId && " — 1 selected"}
            </p>
            {selectedId && (
              <button
                onClick={() => setShowTryOn(true)}
                className="text-xs font-semibold bg-brand-500 text-white px-3 py-1.5 rounded-lg"
              >
                Try On
              </button>
            )}
          </div>
        )}

        {/* Garment grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.007.662-1.86 1.574-2.147" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">Your closet is empty</p>
            <p className="text-sm text-gray-400 mb-4">
              Save garments from posts or add items manually
            </p>
            <button
              onClick={() => setShowAddItem(true)}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              + Add your first item
            </button>
          </div>
        ) : (
          <div className="px-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <GarmentCard
                key={item.id}
                item={item}
                selected={tryOnMode && selectedId === item.garment.id}
                onSelect={
                  tryOnMode ? () => toggleSelect(item.garment.id) : undefined
                }
                onRemove={!tryOnMode ? () => handleRemove(item.id) : undefined}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Try-on modal */}
      {showTryOn && selectedGarment && (
        <TryOnPanel
          garment={{
            id: selectedGarment.garment.id,
            name: selectedGarment.garment.name,
            category: selectedGarment.garment.category,
            brand: selectedGarment.garment.brand.name,
            photos: selectedGarment.garment.photos as string[],
          }}
          onClose={() => setShowTryOn(false)}
          onClearSelection={() => {
            setSelectedId(null);
            setShowTryOn(false);
          }}
        />
      )}

      {/* Chat modal */}
      {showChat && <ChatPanel onClose={() => setShowChat(false)} />}

      {/* Add item modal */}
      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onAdded={() => {
            setShowAddItem(false);
            fetchCloset();
          }}
        />
      )}
    </div>
  );
}
