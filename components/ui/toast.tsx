"use client";

import { useState, useEffect, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

let addToastGlobal: ((message: string, type?: Toast["type"]) => void) | null = null;

export function showToast(message: string, type: Toast["type"] = "error") {
  addToastGlobal?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "error") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  // Listen for offline/online events
  useEffect(() => {
    function handleOffline() {
      addToast("You are offline. Check your internet connection.", "error");
    }
    function handleOnline() {
      addToast("You are back online.", "success");
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  const typeStyles = {
    error: "bg-red-600",
    success: "bg-green-600",
    info: "bg-gray-800",
  };

  return (
    <div className="fixed top-16 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${typeStyles[toast.type]} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-slide-up max-w-sm`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
