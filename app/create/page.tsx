"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { XIcon } from "@/components/icons";
import { ScanResults } from "@/components/create/scan-results";

type Step = "select" | "scan" | "publish";

interface ScanResultData {
  description: string;
  suggestedCaption: string;
  colorPalette: string[];
  detectedItems: {
    name: string;
    category: string;
    color: string;
    confidence: number;
    brand?: string;
    brandId?: string;
    garmentId?: string;
  }[];
}

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("select");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [error, setError] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "VIDEO" : "IMAGE");

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setMediaUrl(result);

      // Auto-trigger scan for images
      if (!isVideo) {
        runScan(result);
      } else {
        setStep("publish");
      }
    };
    reader.readAsDataURL(file);
  }

  async function runScan(imageBase64: string) {
    setStep("scan");
    setScanning(true);
    setError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        throw new Error("Scan failed");
      }

      const data: ScanResultData = await res.json();
      setScanResult(data);
      if (data.suggestedCaption && !caption) {
        setCaption(data.suggestedCaption);
      }
    } catch {
      setError("Failed to scan outfit. You can still publish your post.");
      setScanResult(null);
    } finally {
      setScanning(false);
    }
  }

  async function handlePublish() {
    if (!mediaUrl) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl,
          mediaType,
          caption: caption.trim() || undefined,
          detectedItems: scanResult?.detectedItems || undefined,
          colorPalette: scanResult?.colorPalette || undefined,
          aiDescription: scanResult?.description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create post");
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClearMedia() {
    setMediaUrl(null);
    setStep("select");
    setScanResult(null);
    setCaption("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const stepNumber = step === "select" ? 1 : step === "scan" ? 2 : 3;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === "publish") {
                setStep("scan");
              } else if (step === "scan") {
                handleClearMedia();
              } else {
                router.back();
              }
            }}
            className="text-gray-700"
          >
            {step === "select" ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            )}
          </button>
          <h2 className="font-semibold">New Post</h2>
          {step === "scan" ? (
            <button
              onClick={() => setStep("publish")}
              disabled={scanning}
              className="text-brand-500 font-semibold text-sm disabled:opacity-40"
            >
              Next
            </button>
          ) : step === "publish" ? (
            <button
              onClick={handlePublish}
              disabled={!mediaUrl || loading}
              className="text-brand-500 font-semibold text-sm disabled:opacity-40"
            >
              {loading ? "Posting..." : "Share"}
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </header>

      {/* Step Indicator */}
      {mediaUrl && (
        <div className="max-w-screen-md mx-auto px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-1 flex-1 rounded-full ${
                    s <= stepNumber ? "bg-brand-500" : "bg-gray-200"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">Media</span>
            <span className="text-[10px] text-gray-400">Scan</span>
            <span className="text-[10px] text-gray-400">Publish</span>
          </div>
        </div>
      )}

      <div className="max-w-screen-md mx-auto">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 m-4 rounded-md">
            {error}
          </div>
        )}

        {/* Step 1: Select Media */}
        {step === "select" && !mediaUrl && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium mb-1">Share your look</p>
            <p className="text-sm text-gray-500 mb-6">
              Upload a photo or video of your outfit
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors"
            >
              Select from device
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Scan Results */}
        {step === "scan" && mediaUrl && (
          <div className="p-4 space-y-4">
            {/* Compact Preview */}
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              {mediaType === "VIDEO" ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              )}
              <button
                onClick={handleClearMedia}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Scanning State */}
            {scanning && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="animate-spin h-8 w-8 border-3 border-brand-500 border-t-transparent rounded-full" />
                <span className="text-sm text-gray-500 font-medium">
                  Scanning your outfit...
                </span>
                <p className="text-xs text-gray-400">
                  AI is detecting garments, colors, and brands
                </p>
              </div>
            )}

            {/* Scan Results */}
            {!scanning && scanResult && (
              <ScanResults
                result={scanResult}
                caption={caption}
                onCaptionChange={setCaption}
              />
            )}

            {/* No scan result (error case) */}
            {!scanning && !scanResult && !error && (
              <div className="py-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={3}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Publish Review */}
        {step === "publish" && mediaUrl && (
          <div className="p-4 space-y-4">
            {/* Preview */}
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
              {mediaType === "VIDEO" ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />

            {/* Scan Summary */}
            {scanResult && (
              <div className="bg-brand-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-brand-600 mb-1">
                  AI Scan Complete
                </p>
                <p className="text-xs text-brand-500">
                  {scanResult.detectedItems.length} garments detected
                  {scanResult.colorPalette.length > 0 &&
                    ` · ${scanResult.colorPalette.length} colors`}
                </p>
                <div className="flex gap-1 mt-2">
                  {scanResult.colorPalette.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-brand-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Your post will be shared with your followers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
