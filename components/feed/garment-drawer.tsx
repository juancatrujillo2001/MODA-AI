"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  XIcon,
  ShirtIcon,
} from "@/components/icons";

interface DetectedItem {
  name: string;
  category: string;
  color: string;
  confidence: number;
  brand?: string;
  brandId?: string;
  garmentId?: string;
  price?: number;
  imageUrl?: string;
}

interface ItemState {
  saved?: boolean;
  carted?: boolean;
  loading?: string;
}

interface GarmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: DetectedItem[];
  itemStates: Record<number, ItemState>;
  postImage: string;
  username: string;
  onSaveItem: (item: DetectedItem, index: number) => void;
  onCartItem: (item: DetectedItem, index: number) => void;
  onSaveAll: () => void;
  savingAll: boolean;
  allSaved: boolean;
}

function ItemImage({ item }: { item: DetectedItem }) {
  if (item.imageUrl) {
    return (
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-xl flex-shrink-0 border border-white/[0.1] shadow-lg"
      style={{ backgroundColor: item.color || "#16161f" }}
    />
  );
}

export function GarmentDrawer({
  isOpen,
  onClose,
  items,
  itemStates,
  postImage,
  username,
  onSaveItem,
  onCartItem,
  onSaveAll,
  savingAll,
  allSaved,
}: GarmentDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#111118] rounded-t-[28px] border-t border-white/[0.08] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] max-h-[78vh] flex flex-col animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-purple-400">
              Prendas detectadas
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">
              {items.length} {items.length === 1 ? "prenda" : "prendas"}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Post preview */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] flex-shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/[0.08] flex-shrink-0 relative">
            <Image
              src={postImage}
              alt="Post"
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">@{username}</p>
            <p className="text-[10px] text-gray-600">
              IA detectó {items.length} {items.length === 1 ? "prenda" : "prendas"} en este outfit
            </p>
          </div>
        </div>

        {/* Items list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                <ShirtIcon className="w-7 h-7 text-purple-400/50" />
              </div>
              <p className="text-sm font-semibold text-gray-500 text-center">
                No se detectaron prendas
              </p>
              <p className="text-xs text-gray-700 text-center">
                Este post no tiene datos de análisis AI
              </p>
            </div>
          ) : (
            items.map((item, i) => {
              const state = itemStates[i] || {};
              return (
                <div
                  key={`${item.name}-${i}`}
                  className="flex items-center gap-3 bg-[#16161f] border border-white/[0.06] rounded-2xl p-3.5 hover:border-white/[0.1] transition-all duration-150"
                >
                  <ItemImage item={item} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-600">{item.category}</span>
                      {item.brand && (
                        <>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] text-purple-400">{item.brand}</span>
                        </>
                      )}
                      {item.confidence < 1 && (
                        <>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] text-gray-700">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </>
                      )}
                      {item.price != null && item.price > 0 && (
                        <>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] font-semibold text-white">${item.price}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Save to closet */}
                    <button
                      onClick={() => onSaveItem(item, i)}
                      disabled={!!state.loading || state.saved}
                      className={`h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 text-[10px] font-bold px-2.5 ${
                        state.saved
                          ? "bg-purple-500/20 border border-purple-500/30 text-purple-400"
                          : "bg-white/[0.05] border border-white/[0.08] text-gray-500 hover:text-white hover:bg-white/[0.1] disabled:opacity-50"
                      }`}
                    >
                      {state.loading === "save" ? (
                        <span className="w-3 h-3 border border-gray-500 border-t-white rounded-full animate-spin" />
                      ) : state.saved ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Closet
                        </span>
                      ) : (
                        "Closet"
                      )}
                    </button>

                    {/* Add to cart */}
                    <button
                      onClick={() => onCartItem(item, i)}
                      disabled={!!state.loading || state.carted}
                      className={`h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 text-[10px] font-bold px-2.5 ${
                        state.carted
                          ? "bg-pink-500/20 border border-pink-500/30 text-pink-400"
                          : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50"
                      }`}
                    >
                      {state.loading === "cart" ? (
                        <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : state.carted ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Carrito
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          Carrito
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — bulk save */}
        {items.length > 0 && (
          <div className="px-4 py-4 border-t border-white/[0.06] flex-shrink-0 safe-area-bottom">
            <button
              onClick={onSaveAll}
              disabled={savingAll || allSaved}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                allSaved
                  ? "bg-purple-500/20 border border-purple-500/30 text-purple-400"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:opacity-70"
              }`}
            >
              {allSaved ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Outfit guardado en tu closet
                </span>
              ) : savingAll ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                <>
                  <span>Guardar todo al closet</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs font-black">
                    {items.length}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
