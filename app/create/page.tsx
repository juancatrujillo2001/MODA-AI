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
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function processFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen es muy grande. Usa una foto de menos de 8MB.");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "VIDEO" : "IMAGE");

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setMediaUrl(result);

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
      setError("Error al analizar outfit. Puedes continuar y publicar tu post.");
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
          style: style || undefined,
          detectedItems: scanResult?.detectedItems || undefined,
          colorPalette: scanResult?.colorPalette || undefined,
          aiDescription: scanResult?.description || undefined,
        }),
      });

      if (!res.ok) {
        let errMsg = "Error al crear el post";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          // If response isn't JSON
        }
        setError(errMsg);
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleClearMedia() {
    setMediaUrl(null);
    setStep("select");
    setScanResult(null);
    setCaption("");
    setStyle("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const stepNumber = step === "select" ? 1 : step === "scan" ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0 sticky top-0 bg-[rgba(10,10,15,0.85)] backdrop-blur-xl z-50">
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
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-150 active:scale-90"
        >
          {step === "select" ? (
            <XIcon className="w-4 h-4" />
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
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
        <h2 className="text-base font-bold text-white tracking-tight">Nuevo post</h2>
        {step === "scan" ? (
          <button
            onClick={() => setStep("publish")}
            disabled={scanning}
            className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:text-gray-700 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        ) : step === "publish" ? (
          <button
            onClick={handlePublish}
            disabled={!mediaUrl || loading}
            className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:text-gray-700 disabled:cursor-not-allowed"
          >
            {loading ? "Publicando..." : "Compartir"}
          </button>
        ) : (
          <div className="w-12" />
        )}
      </header>

      {/* Step Indicator */}
      {mediaUrl && (
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/[0.04]">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= stepNumber
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>
      )}

      <div className="max-w-screen-md mx-auto w-full flex-1 flex flex-col">
        {error && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Select Media */}
        {step === "select" && !mediaUrl && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) processFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full aspect-[4/5] max-h-[380px] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-5 cursor-pointer group transition-all duration-300 overflow-hidden ${
                isDragOver
                  ? "border-purple-500/60 bg-purple-500/[0.06] shadow-[inset_0_0_40px_rgba(168,85,247,0.08)]"
                  : "border-white/[0.1] hover:border-purple-500/50 hover:bg-purple-500/[0.03]"
              }`}
            >
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(168,85,247,0.04),transparent)] group-hover:bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(168,85,247,0.08),transparent)] transition-all duration-500" />

              {/* Camera icon */}
              <div className="relative w-20 h-20 rounded-[20px] bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 group-hover:border-purple-500/40 transition-all duration-300">
                <svg
                  className="w-9 h-9 text-purple-400 group-hover:text-purple-300 transition-colors"
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

              <p className="relative text-base font-bold text-white text-center">Comparte tu look</p>
              <p className="relative text-sm text-gray-600 text-center leading-relaxed -mt-2">
                Arrastra tu foto aquí o toca para seleccionar
              </p>

              {/* Format badges */}
              <div className="relative flex items-center gap-3">
                {["JPG", "PNG", "MP4", "HEIC"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] font-semibold text-gray-600 tracking-wider"
                  >
                    {fmt}
                  </span>
                ))}
              </div>

              {/* Select file button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="relative px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300 active:scale-95"
              >
                Seleccionar archivo
              </button>
            </div>

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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Image preview */}
            <div className="relative w-full min-h-[350px] bg-[#0a0a0f] overflow-hidden flex-shrink-0">
              {mediaType === "VIDEO" ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-contain min-h-[350px]"
                />
              ) : (
                <div className="relative w-full min-h-[350px]">
                  <Image
                    src={mediaUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 640px"
                  />
                </div>
              )}
              <button
                onClick={handleClearMedia}
                className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm border border-white/[0.1] text-gray-400 hover:text-white flex items-center justify-center transition-all active:scale-90"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Scanning State */}
            {scanning && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400">
                    AI analizando tu look
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Detectando prendas, colores y marcas
                </p>
              </div>
            )}

            {/* Scan Results */}
            {!scanning && scanResult && (
              <div className="flex-1 overflow-y-auto p-5 border-t border-white/[0.06]">
                <ScanResults
                  result={scanResult}
                  caption={caption}
                  onCaptionChange={setCaption}
                  style={style}
                  onStyleChange={setStyle}
                />
              </div>
            )}

            {/* No scan result (error case) */}
            {!scanning && !scanResult && !error && (
              <div className="p-5 border-t border-white/[0.06]">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe algo sobre tu look..."
                  rows={3}
                  className="w-full text-sm bg-[#111118] border border-white/[0.08] rounded-2xl p-4 text-white placeholder:text-gray-700 resize-none focus:outline-none focus:border-purple-500/40 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Publish Review */}
        {step === "publish" && mediaUrl && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Image preview */}
            <div className="relative w-full min-h-[350px] bg-[#0a0a0f] overflow-hidden flex-shrink-0">
              {mediaType === "VIDEO" ? (
                <video
                  src={mediaUrl}
                  className="w-full min-h-[350px] object-contain"
                  controls
                />
              ) : (
                <div className="relative w-full min-h-[350px]">
                  <Image
                    src={mediaUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 640px"
                  />
                </div>
              )}
            </div>

            {/* Publish details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 border-t border-white/[0.06]">
              {/* Caption */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Caption
                </p>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe algo sobre tu look..."
                  rows={3}
                  className="w-full text-sm bg-[#111118] border border-white/[0.08] rounded-2xl p-4 text-white placeholder:text-gray-700 resize-none focus:outline-none focus:border-purple-500/40 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all"
                />
              </div>

              {/* Style tag */}
              {style && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500">
                    Estilo:
                  </span>
                  <span className="text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full">
                    {style}
                  </span>
                </div>
              )}

              {/* Scan Summary */}
              {scanResult && (
                <div className="bg-[#16161f] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <p className="text-xs font-bold text-purple-400">
                      AI scan completo
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {scanResult.detectedItems.length} prendas detectadas
                    {scanResult.colorPalette.length > 0 &&
                      ` · ${scanResult.colorPalette.length} colores`}
                    {style && ` · ${style}`}
                  </p>
                  {scanResult.colorPalette.length > 0 && (
                    <div className="flex gap-2">
                      {scanResult.colorPalette.slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-white/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-gray-700 text-center">
                Tu post sera visible para tus seguidores
              </p>
            </div>

            {/* Publish button footer */}
            <div className="flex-shrink-0 p-4 border-t border-white/[0.06] bg-[#111118]">
              <button
                onClick={handlePublish}
                disabled={!mediaUrl || loading}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  mediaUrl && !loading
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 active:scale-[0.98]"
                    : "bg-[#1a1a25] border border-white/[0.06] text-gray-600 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publicando...
                  </span>
                ) : (
                  "Publicar look →"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
