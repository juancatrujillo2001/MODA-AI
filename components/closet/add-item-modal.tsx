"use client";

import { useState } from "react";
import { XIcon } from "@/components/icons";

interface AddItemModalProps {
  onClose: () => void;
  onAdded: () => void;
}

const CATEGORIES = ["Shirts", "Jeans", "Shoes", "Accessories", "Jackets"];

export function AddItemModal({ onClose, onAdded }: AddItemModalProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("#000000");
  const [price, setPrice] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [source, setSource] = useState<"SAVED" | "PURCHASED">("PURCHASED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      setError("Name and brand are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim(),
          category,
          sizes: size.trim()
            ? size.split(",").map((s) => s.trim())
            : [],
          colors: [color],
          price: parseFloat(price) || 0,
          photoUrl: photoUrl.trim() || null,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add item");
        return;
      }

      onAdded();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold">Add to Closet</h3>
          <button onClick={onClose}>
            <XIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic White T-Shirt"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Brand *
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Nike, Zara, H&M"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category & Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Source
              </label>
              <select
                value={source}
                onChange={(e) =>
                  setSource(e.target.value as "SAVED" | "PURCHASED")
                }
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="PURCHASED">Purchased</option>
                <option value="SAVED">Saved</option>
              </select>
            </div>
          </div>

          {/* Size & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Size(s)
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="S, M, L or 42"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{color}</span>
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Photo URL
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Paste a link to the garment image (optional)
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim() || !brand.trim()}
            className="w-full py-3 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Closet"}
          </button>
        </form>
      </div>
    </div>
  );
}
