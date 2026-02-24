"use client";

import { useState } from "react";
import Image from "next/image";
import { XIcon } from "@/components/icons";

interface TryOnPanelProps {
  garment: {
    id: string;
    name: string;
    category: string;
    brand: string;
    photos: string[];
  };
  onClose: () => void;
  onClearSelection: () => void;
}

export function TryOnPanel({ garment, onClose, onClearSelection }: TryOnPanelProps) {
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/closet/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId: garment.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate try-on");
        return;
      }

      setResultImage(data.image);
      setIsPlaceholder(data.isPlaceholder);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold">Virtual Try-On</h3>
          <button onClick={onClose}>
            <XIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selected garment */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Selected Garment
            </p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              {garment.photos[0] && (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                  <Image
                    src={garment.photos[0]}
                    alt={garment.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{garment.name}</p>
                <p className="text-xs text-gray-500">
                  {garment.brand} &middot; {garment.category}
                </p>
              </div>
            </div>
          </div>

          {/* Result area */}
          {resultImage ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Try-On Result
              </p>
              <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                {resultImage.startsWith("data:image/svg") ? (
                  // Placeholder SVG — render as img with data URI
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultImage}
                    alt="Virtual Try-On Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  // Real generated image
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultImage}
                    alt={`Virtual try-on: ${garment.name}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {isPlaceholder && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    <strong>Preview mode:</strong> Configure Google Cloud credentials
                    (GOOGLE_CLOUD_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS) in
                    your .env file to enable AI-generated virtual try-on images.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
              {loading ? (
                <div className="text-center px-6">
                  <div className="animate-spin h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">
                    Generating try-on image...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    This may take 10-15 seconds
                  </p>
                </div>
              ) : (
                <div className="text-center px-6">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">
                    See how it looks on you
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uses your profile photo with the selected garment
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClearSelection}
              className="flex-1 py-2.5 bg-gray-100 text-sm font-semibold rounded-lg hover:bg-gray-200"
            >
              Clear
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {loading
                ? "Generating..."
                : resultImage
                  ? "Regenerate"
                  : "Generate Try-On"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
