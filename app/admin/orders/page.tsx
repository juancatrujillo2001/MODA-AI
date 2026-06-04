"use client";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-black">
          Ordenes
        </h1>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
          Gestion de pedidos de la plataforma
        </p>
      </div>

      <div className="border border-gray-100 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-black mb-2">
          PROXIMAMENTE
        </p>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest max-w-xs mx-auto">
          El sistema de ordenes estara disponible pronto
        </p>
      </div>
    </div>
  );
}
