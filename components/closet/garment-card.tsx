"use client";

import Image from "next/image";
import { XIcon } from "@/components/icons";

interface GarmentCardProps {
  item: {
    id: string;
    garment: {
      id: string;
      name: string;
      category: string;
      colors: unknown;
      sizes: unknown;
      photos: unknown;
      price: string;
      brand: { name: string; logo: string | null };
    };
    source: "SAVED" | "PURCHASED";
  };
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}

export function GarmentCard({ item, selected, onSelect, onRemove }: GarmentCardProps) {
  const photos = item.garment.photos as string[];
  const colors = item.garment.colors as string[];
  const sizes = item.garment.sizes as string[];
  const photo = photos?.[0];

  return (
    <div
      className={`relative bg-white rounded-lg border overflow-hidden transition-all ${
        selected
          ? "border-brand-500 ring-2 ring-brand-200"
          : "border-gray-200"
      } ${onSelect ? "cursor-pointer" : ""}`}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {photo ? (
          <Image
            src={photo}
            alt={item.garment.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 2.25H8.25L4.5 6l2.25 1.5V21h10.5V7.5L19.5 6l-3.75-3.75zM8.25 2.25L12 6l3.75-3.75" />
            </svg>
          </div>
        )}

        {/* Source badge */}
        <span
          className={`absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            item.source === "PURCHASED"
              ? "bg-green-100 text-green-700"
              : "bg-brand-100 text-brand-700"
          }`}
        >
          {item.source === "PURCHASED" ? "Bought" : "Saved"}
        </span>

        {/* Selected check */}
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60"
          >
            <XIcon className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-semibold truncate">{item.garment.name}</p>
        <p className="text-[11px] text-gray-500 truncate">
          {item.garment.brand.name}
        </p>

        {/* Sizes */}
        {sizes && sizes.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {sizes.slice(0, 4).map((size: string, i: number) => (
              <span
                key={i}
                className="text-[9px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
              >
                {size}
              </span>
            ))}
            {sizes.length > 4 && (
              <span className="text-[9px] text-gray-400">+{sizes.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div className="flex gap-1">
            {colors?.slice(0, 3).map((color: string, i: number) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-gray-700">
            ${item.garment.price}
          </span>
        </div>
      </div>
    </div>
  );
}
