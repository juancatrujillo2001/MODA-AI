"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { SendIcon } from "@/components/icons";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";

/* ─── Types ────────────────────────────────────────── */
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

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/* ─── Category groups ──────────────────────────────── */
const CATEGORY_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Gorros", keys: ["Accessories", "Gorros"] },
  { label: "Camisas", keys: ["Tops", "Shirts", "Camisas"] },
  { label: "Pantalones", keys: ["Bottoms", "Pants", "Pantalones", "Jeans"] },
  { label: "Zapatos", keys: ["Footwear", "Shoes", "Zapatos"] },
  { label: "Abrigos", keys: ["Outerwear", "Jackets"] },
  { label: "Vestidos", keys: ["Vestidos", "Dresses"] },
  { label: "Otros", keys: [] },
];

function categorize(items: ClosetItem[]) {
  const allKnownKeys = CATEGORY_GROUPS.flatMap((g) => g.keys);
  const groups: { label: string; items: ClosetItem[] }[] = [];

  for (const group of CATEGORY_GROUPS) {
    if (group.keys.length === 0) {
      const others = items.filter(
        (i) => !allKnownKeys.some((k) => k.toLowerCase() === i.garment.category.toLowerCase())
      );
      if (others.length > 0) groups.push({ label: group.label, items: others });
    } else {
      const matched = items.filter((i) =>
        group.keys.some((k) => k.toLowerCase() === i.garment.category.toLowerCase())
      );
      if (matched.length > 0) groups.push({ label: group.label, items: matched });
    }
  }
  return groups;
}

type SourceTab = "SAVED" | "PURCHASED";

/* ─── Page ─────────────────────────────────────────── */
export default function ClosetPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Usuario";

  /* ─ Closet state ─ */
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceTab, setSourceTab] = useState<SourceTab>("SAVED");

  /* ─ Selection state ─ */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ─ Try-on state ─ */
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);

  /* ─ Chat state ─ */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hola, soy tu curador de estilo. Puedo ayudarte a armar combinaciones, sugerir piezas faltantes y darte consejos personalizados.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  /* ─── Fetch closet ───────────────────────────────── */
  const fetchCloset = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("source", sourceTab);
    const res = await fetch(`/api/closet?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [sourceTab]);

  useEffect(() => {
    setLoading(true);
    fetchCloset();
  }, [fetchCloset]);

  /* ─── Selection toggle ───────────────────────────── */
  function toggleSelect(garmentId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(garmentId)) next.delete(garmentId);
      else next.add(garmentId);
      return next;
    });
  }

  /* ─── Try-on ─────────────────────────────────────── */
  async function handleTryOn() {
    if (selectedIds.size === 0) return;
    const garmentId = Array.from(selectedIds)[0];
    setTryOnLoading(true);
    try {
      const res = await fetch("/api/closet/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId }),
      });
      const data = await res.json();
      if (res.ok) setTryOnImage(data.image);
    } catch {
      /* ignore */
    } finally {
      setTryOnLoading(false);
    }
  }

  function handleReset() {
    setSelectedIds(new Set());
    setTryOnImage(null);
  }

  /* ─── Chat ───────────────────────────────────────── */
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages]);

  async function handleChatSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
    };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = updated
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/closet/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: history.slice(0, -1),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: "Error al procesar. Intenta de nuevo." },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Error de conexion." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  /* ─── Derived ────────────────────────────────────── */
  const groups = categorize(items);
  const selCount = selectedIds.size;

  /* ─── Render ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-28 pt-4 selection:bg-purple-500/20 selection:text-purple-300">
      <TopHeader />

      <div className="max-w-[600px] mx-auto px-4 space-y-5">
        {/* ─── Page title ──────────────────────────── */}
        <div className="flex items-center justify-between mb-2 pt-14">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Mi Closet</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tu guardarropa digital</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-purple-400">{userName}</span>
          </div>
        </div>

        {/* ─── Try-on area ─────────────────────────── */}
        <div className="relative bg-[#111118] border border-white/[0.07] rounded-[24px] overflow-hidden">
          {/* Try-on header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">
                Modelo Activo
              </span>
              <span className="text-sm font-bold text-white ml-1">{userName}</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative flex flex-col items-center justify-center min-h-[280px] bg-gradient-to-b from-[#111118] to-[#0d0d14] py-8">
            {tryOnImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tryOnImage}
                alt="Try-on preview"
                className={`w-full h-full ${
                  tryOnImage.startsWith("data:image/svg") ? "object-contain" : "object-cover"
                }`}
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/[0.08] flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  Selecciona prendas para<br />probártelas
                </p>
              </div>
            )}

            {/* Loading overlay */}
            {tryOnLoading && (
              <div className="absolute inset-0 bg-[rgba(10,10,15,0.85)] backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-400 tracking-wider">
                  Generando Try-On...
                </p>
              </div>
            )}
          </div>

          {/* Actions footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.06]">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-gray-500 text-sm font-semibold hover:bg-white/[0.04] hover:text-white transition-all duration-150 active:scale-95"
            >
              Reset
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
            >
              Guardar Look
            </button>
          </div>
        </div>

        {/* ─── Source tabs ─────────────────────────── */}
        <div className="flex border-b border-white/[0.06]">
          {(
            [
              { label: "Mis Guardados", value: "SAVED" },
              { label: "Mis Compras", value: "PURCHASED" },
            ] as { label: string; value: SourceTab }[]
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setSourceTab(tab.value); setSelectedIds(new Set()); setTryOnImage(null); }}
              className={`flex-1 py-3.5 text-sm font-semibold text-center relative cursor-pointer transition-colors duration-150 ${
                sourceTab === tab.value
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {tab.label}
              {sourceTab === tab.value && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ─── Content ─────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-500/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.007.662-1.86 1.574-2.147" />
              </svg>
            </div>
            <p className="text-base font-bold text-gray-600">Tu closet está vacío</p>
            <p className="text-sm text-gray-700 text-center">
              Guarda prendas del feed para verlas aquí
            </p>
            <Link
              href="/feed"
              className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-500 text-sm font-semibold hover:bg-white/[0.07] hover:text-white transition-all duration-150"
            >
              Explorar feed →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Category groups */}
            {groups.map((group) => (
              <div key={group.label} className="space-y-3">
                {/* Category header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-600">
                    {group.label}
                  </h3>
                  <span className="text-[10px] font-semibold text-gray-700 tracking-wider uppercase">
                    {group.items.length} {group.items.length === 1 ? "articulo" : "articulos"}
                  </span>
                </div>

                {/* Garment grid */}
                <div className="grid grid-cols-3 gap-3">
                  {group.items.map((item) => {
                    const photos = item.garment.photos as string[];
                    const photo = photos?.[0];
                    const isSelected = selectedIds.has(item.garment.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleSelect(item.garment.id)}
                        className={`relative aspect-[3/4] bg-[#111118] border rounded-2xl overflow-hidden group cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-purple-500 ring-2 ring-purple-500/20 scale-[0.97]"
                            : "border-white/[0.07] hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                        }`}
                      >
                        {photo ? (
                          <Image
                            src={photo}
                            alt={item.garment.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 600px) 33vw, 180px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#16161f]">
                            <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 2.25H8.25L4.5 6l2.25 1.5V21h10.5V7.5L19.5 6l-3.75-3.75zM8.25 2.25L12 6l3.75-3.75" />
                            </svg>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                          <p className="text-[10px] font-semibold text-white leading-tight truncate">
                            {item.garment.name}
                          </p>
                        </div>

                        {/* Hover "Probar" button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold">
                            Probar
                          </span>
                        </div>

                        {/* Selected check */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                        )}

                        {/* Source badge */}
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase backdrop-blur-sm ${
                          item.source === "PURCHASED"
                            ? "bg-white/10 text-gray-300 border border-white/[0.1]"
                            : "bg-purple-500/90 text-white"
                        }`}>
                          {item.source === "PURCHASED" ? "Compra" : "Guardado"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ─── AI Style Curator Chat ──────────── */}
            <div className="bg-[#111118] border border-white/[0.07] rounded-[20px] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400">
                    IA Stylist
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={chatScrollRef}
                className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto scrollbar-hide"
              >
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed animate-fade-in rounded-2xl ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-white/[0.05] text-gray-300 border border-white/[0.07]"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl px-4 py-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-xs text-gray-600 ml-2">
                        Pensando...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleChatSend}
                className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.06]"
              >
                <div className="flex-1 flex items-center gap-3 bg-[#0a0a0f] border border-white/[0.06] rounded-xl px-4 py-3 focus-within:border-purple-500/40 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.08)] transition-all">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="¿Qué combina con esto?"
                    className="flex-1 bg-transparent text-white placeholder:text-gray-700 text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all active:scale-90 disabled:opacity-30"
                >
                  <SendIcon className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ─── Sticky try-on button ──────────────────── */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-40 flex justify-center">
        <button
          onClick={handleTryOn}
          disabled={selCount === 0 || tryOnLoading}
          className={`w-full max-w-[560px] py-4 rounded-2xl text-sm font-bold tracking-wide text-center transition-all duration-200 ${
            selCount > 0
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              : "bg-[#111118] border border-white/[0.06] text-gray-600 cursor-not-allowed"
          }`}
        >
          {tryOnLoading
            ? "Procesando..."
            : selCount > 0
              ? `Probármelo (${selCount}) →`
              : "Selecciona una prenda para probarla"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
