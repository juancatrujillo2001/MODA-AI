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
  style: string;
  onStyleChange: (style: string) => void;
  onItemsChange?: (items: DetectedItem[]) => void;
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

const OUTFIT_STYLES = [
  "Streetwear",
  "Fresh",
  "Casual",
  "Formal",
  "Sporty",
  "Vintage",
  "Bohemian",
  "Minimalist",
  "Luxury",
  "Y2K",
  "Dark Academia",
  "Preppy",
  "Techwear",
  "Cottagecore",
];

export function ScanResults({
  result,
  caption,
  onCaptionChange,
  style,
  onStyleChange,
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
  const [captionLoading, setCaptionLoading] = useState(false);
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());

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

  async function handleSuggestCaption() {
    setCaptionLoading(true);
    try {
      const itemNames = allItems.map((i) => i.name).join(", ");
      const prompt = `Outfit: ${itemNames}${style ? `. Style: ${style}` : ""}`;

      const res = await fetch("/api/closet/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a short, engaging social media caption (under 150 chars, include emojis) for this outfit post: ${prompt}. Reply ONLY with the caption text, nothing else.`,
          history: [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onCaptionChange(data.reply || result.suggestedCaption);
      } else {
        onCaptionChange(result.suggestedCaption);
      }
    } catch {
      onCaptionChange(result.suggestedCaption);
    } finally {
      setCaptionLoading(false);
    }
  }

  function handleDeleteItem(index: number) {
    setDeletedIndices((prev) => new Set(prev).add(index));
    if (index >= result.detectedItems.length) {
      const manualIdx = index - result.detectedItems.length;
      setManualItems((prev) => prev.filter((_, i) => i !== manualIdx));
    }
  }

  const allItems = [
    ...result.detectedItems.filter((_, i) => !deletedIndices.has(i)),
    ...manualItems,
  ];

  return (
    <div className="space-y-6">
      {/* AI Description */}
      <div className="bg-[#16161f] border border-white/[0.06] rounded-2xl p-4">
        <p className="text-sm text-gray-400 leading-relaxed italic">{result.description}</p>
      </div>

      {/* Color Palette */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3">
          Paleta de colores
        </p>
        <div className="flex gap-3">
          {result.colorPalette.slice(0, 5).map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-full border border-white/10 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
              <span className="text-[8px] font-bold text-gray-600">
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detected Garments */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3">
          Prendas detectadas ({allItems.length})
        </p>
        <div className="space-y-2">
          {allItems.map((item, displayIdx) => {
            const origIndex = displayIdx;
            const state = itemStates[origIndex] || {};
            return (
              <div
                key={`${item.name}-${displayIdx}`}
                className="flex items-center justify-between bg-[#111118] p-3 rounded-2xl border border-white/[0.07] hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <ShirtIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-600">
                      {item.category}
                      {item.color && ` · ${item.color}`}
                      {item.brand && ` · ${item.brand}`}
                      {item.confidence < 1 &&
                        ` · ${Math.round(item.confidence * 100)}%`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {state.saved ? (
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg">
                      Guardado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSave(item, origIndex)}
                      disabled={!!state.loading}
                      className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1.5 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
                    >
                      {state.loading === "save" ? "..." : "Guardar"}
                    </button>
                  )}
                  {state.carted ? (
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg">
                      En carrito
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCart(item, origIndex)}
                      disabled={!!state.loading}
                      className="text-[10px] font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {state.loading === "cart" ? "..." : "Carrito"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteItem(displayIdx)}
                    className="text-gray-700 hover:text-red-400 px-1.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Add */}
      {showManualForm ? (
        <div className="bg-[#16161f] p-4 space-y-3 rounded-2xl border border-white/[0.06]">
          <p className="text-xs font-semibold text-gray-500">
            Agregar prenda manualmente
          </p>
          <input
            type="text"
            placeholder="Nombre de la prenda"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="w-full text-sm bg-[#111118] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/40 transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              className="flex-1 text-sm bg-[#111118] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500/40 transition-colors"
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
              className="flex-1 text-sm bg-[#111118] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/40 transition-colors"
            />
          </div>
          <input
            type="text"
            placeholder="Marca (opcional)"
            value={manualBrand}
            onChange={(e) => setManualBrand(e.target.value)}
            className="w-full text-sm bg-[#111118] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/40 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualAdd}
              disabled={!manualName.trim() || !manualColor.trim()}
              className="text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Agregar
            </button>
            <button
              onClick={() => setShowManualForm(false)}
              className="text-xs font-bold text-gray-500 px-5 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowManualForm(true)}
          className="w-full text-sm text-purple-400 font-bold py-3.5 rounded-2xl border-2 border-dashed border-white/[0.1] hover:border-purple-500/40 hover:bg-purple-500/[0.03] transition-all"
        >
          + Agregar prenda manualmente
        </button>
      )}

      {/* Outfit Style Selector */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3">
          Estilo del outfit
        </p>
        <div className="flex flex-wrap gap-2">
          {OUTFIT_STYLES.map((s) => (
            <button
              key={s}
              onClick={() => onStyleChange(style === s ? "" : s)}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                style === s
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:border-purple-500/30 hover:text-purple-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500">
            Caption
          </p>
          <button
            onClick={handleSuggestCaption}
            disabled={captionLoading}
            className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
          >
            {captionLoading ? "Generando..." : "Sugerir caption AI"}
          </button>
        </div>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Escribe algo sobre tu look..."
          rows={3}
          className="w-full text-sm bg-[#111118] border border-white/[0.08] rounded-2xl p-4 text-white placeholder:text-gray-700 resize-none focus:outline-none focus:border-purple-500/40 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all"
        />
      </div>
    </div>
  );
}
