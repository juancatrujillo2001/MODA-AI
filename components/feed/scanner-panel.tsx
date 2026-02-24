"use client";

import { useState, useEffect } from "react";
import { XIcon } from "@/components/icons";

interface DetectedItem {
  name: string;
  category: string;
  color: string;
  confidence: number;
  brand?: string;
  brandId?: string;
  garmentId?: string;
}

interface ScanResult {
  description: string;
  colorPalette: string[];
  detectedItems: DetectedItem[];
}

interface ScannerPanelProps {
  postId: string;
  onClose: () => void;
}

export function ScannerPanel({ postId, onClose }: ScannerPanelProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [itemStates, setItemStates] = useState<
    Record<number, { saved?: boolean; carted?: boolean; loading?: string }>
  >({});

  useEffect(() => {
    async function scan() {
      try {
        const res = await fetch(`/api/posts/${postId}/scan`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Scan failed");
        const data = await res.json();
        setResult(data);
      } catch {
        setError("Failed to scan outfit. Try again later.");
      } finally {
        setLoading(false);
      }
    }
    scan();
  }, [postId]);

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
    setItemStates((s) => ({ ...s, [index]: { ...s[index], loading: "cart" } }));

    try {
      let garmentId = item.garmentId;

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

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-brand-500">
          Outfit Scanner
        </h3>
        <button onClick={onClose}>
          <XIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-500">Scanning outfit...</span>
        </div>
      )}

      {error && <p className="text-sm text-red-500 py-2">{error}</p>}

      {result && (
        <div className="space-y-4">
          {/* Description */}
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
                  className="w-8 h-8 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Detected Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Detected Garments
            </p>
            <div className="space-y-2">
              {result.detectedItems.map((item, i) => {
                const state = itemStates[i] || {};
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.category} &middot; {item.color} &middot;{" "}
                        {Math.round(item.confidence * 100)}% match
                      </p>
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
        </div>
      )}
    </div>
  );
}
