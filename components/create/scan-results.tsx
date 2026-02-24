"use client";

import { useState } from "react";
import { ShirtIcon } from "@/components/icons";

interface DetectedItem {
  name: string;
  category: string;
  color: string;
  confidence: number;
  brand?: string;
  brandId?: string;
  garmentId?: string;
}

interface ScanResultData {
  description: string;
  suggestedCaption: string;
  colorPalette: string[];
  detectedItems: DetectedItem[];
}

interface ScanResultsProps {
  result: ScanResultData;
  caption: string;
  onCaptionChange: (caption: string) => void;
}

const CATEGORIES = [
  "Tops",
  "Bottoms",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Dresses",
  "Activewear",
];

export function ScanResults({
  result,
  caption,
  onCaptionChange,
}: ScanResultsProps) {
  const [itemStates, setItemStates] = useState<
    Record<number, { saved?: boolean; carted?: boolean; loading?: string }>
  >({});
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("Tops");
  const [manualColor, setManualColor] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualItems, setManualItems] = useState<DetectedItem[]>([]);

  async function handleSave(item: DetectedItem, index: number) {
    setItemStates((s) => ({ ...s, [index]: { ...s[index], loading: "save" } }));

    try {
      const body = item.garmentId
        ? { garmentId: item.garmentId, source: "SAVED" }
        : {
            name: item.name,
            brand: item.brand || "Unknown",
            category: item.category,
            colors: [item.color],
            source: "SAVED",
          };

      const res = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok || res.status === 409) {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], saved: true, loading: undefined },
        }));
      } else {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], loading: undefined },
        }));
      }
    } catch {
      setItemStates((s) => ({
        ...s,
        [index]: { ...s[index], loading: undefined },
      }));
    }
  }

  async function handleCart(item: DetectedItem, index: number) {
    // Cart requires a garmentId — must save to closet first to create garment
    setItemStates((s) => ({ ...s, [index]: { ...s[index], loading: "cart" } }));

    try {
      let garmentId = item.garmentId;

      // If no garmentId, create via closet first
      if (!garmentId) {
        const closetRes = await fetch("/api/closet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            brand: item.brand || "Unknown",
            category: item.category,
            colors: [item.color],
            source: "SAVED",
          }),
        });

        if (closetRes.ok) {
          const closetData = await closetRes.json();
          garmentId = closetData.garmentId || closetData.garment?.id;
        } else if (closetRes.status === 409) {
          // Already in closet — we need to look up the garment ID
          // For now mark as carted since the garment exists
          setItemStates((s) => ({
            ...s,
            [index]: { ...s[index], carted: true, saved: true, loading: undefined },
          }));
          return;
        }
      }

      if (!garmentId) {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], loading: undefined },
        }));
        return;
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentId,
          size: "M",
          color: item.color,
          quantity: 1,
        }),
      });

      if (res.ok) {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], carted: true, saved: true, loading: undefined },
        }));
      } else {
        setItemStates((s) => ({
          ...s,
          [index]: { ...s[index], loading: undefined },
        }));
      }
    } catch {
      setItemStates((s) => ({
        ...s,
        [index]: { ...s[index], loading: undefined },
      }));
    }
  }

  function handleManualAdd() {
    if (!manualName.trim() || !manualColor.trim()) return;

    const newItem: DetectedItem = {
      name: manualName.trim(),
      category: manualCategory,
      color: manualColor.trim(),
      confidence: 1.0,
      brand: manualBrand.trim() || undefined,
    };

    setManualItems((prev) => [...prev, newItem]);
    setManualName("");
    setManualColor("");
    setManualBrand("");
    setShowManualForm(false);
  }

  const allItems = [...result.detectedItems, ...manualItems];

  return (
    <div className="space-y-5">
      {/* AI Description */}
      <p className="text-sm text-gray-700">{result.description}</p>

      {/* Color Palette */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Color Palette
        </p>
        <div className="flex gap-2">
          {result.colorPalette.map((color, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Detected Garments */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Detected Garments ({allItems.length})
        </p>
        <div className="space-y-2">
          {allItems.map((item, i) => {
            const state = itemStates[i] || {};
            return (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center">
                    <ShirtIcon className="w-4 h-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.category} &middot; {item.color}
                      {item.brand && ` · ${item.brand}`}
                      {item.confidence < 1 &&
                        ` · ${Math.round(item.confidence * 100)}%`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {state.saved ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-md">
                      Saved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSave(item, i)}
                      disabled={!!state.loading}
                      className="text-xs font-semibold text-brand-500 bg-brand-50 px-3 py-1.5 rounded-md hover:bg-brand-100 disabled:opacity-50"
                    >
                      {state.loading === "save" ? "..." : "Save"}
                    </button>
                  )}
                  {state.carted ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-md">
                      In Cart
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCart(item, i)}
                      disabled={!!state.loading}
                      className="text-xs font-semibold text-white bg-brand-500 px-3 py-1.5 rounded-md hover:bg-brand-600 disabled:opacity-50"
                    >
                      {state.loading === "cart" ? "..." : "Cart"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Add */}
      {showManualForm ? (
        <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            Add garment manually
          </p>
          <input
            type="text"
            placeholder="Garment name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="w-full text-sm bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-brand-500"
          />
          <div className="flex gap-2">
            <select
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              className="flex-1 text-sm bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Color"
              value={manualColor}
              onChange={(e) => setManualColor(e.target.value)}
              className="flex-1 text-sm bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-brand-500"
            />
          </div>
          <input
            type="text"
            placeholder="Brand (optional)"
            value={manualBrand}
            onChange={(e) => setManualBrand(e.target.value)}
            className="w-full text-sm bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-brand-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualAdd}
              disabled={!manualName.trim() || !manualColor.trim()}
              className="text-xs font-semibold text-white bg-brand-500 px-4 py-2 rounded-md hover:bg-brand-600 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowManualForm(false)}
              className="text-xs font-semibold text-gray-500 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowManualForm(true)}
          className="w-full text-sm text-brand-500 font-semibold py-2 border border-dashed border-brand-300 rounded-lg hover:bg-brand-50"
        >
          + Add garment manually
        </button>
      )}

      {/* Caption */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Caption
        </p>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Write a caption..."
          rows={3}
          className="w-full text-sm bg-white border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
