"use client";

import { useState, useEffect } from "react";
import { XIcon } from "@/components/icons";

interface DetectedItem {
  name: string;
  category: string;
  color: string;
  confidence: number;
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
              {result.detectedItems.map((item, i) => (
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
                    <button className="text-xs font-semibold text-brand-500 bg-brand-50 px-3 py-1.5 rounded-md hover:bg-brand-100">
                      Save
                    </button>
                    <button className="text-xs font-semibold text-white bg-brand-500 px-3 py-1.5 rounded-md hover:bg-brand-600">
                      Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
