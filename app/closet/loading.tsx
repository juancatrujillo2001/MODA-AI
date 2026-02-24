export default function ClosetLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="skeleton w-20 h-7" />
          <div className="flex gap-4">
            <div className="skeleton w-6 h-6 rounded-full" />
            <div className="skeleton w-6 h-6 rounded-full" />
          </div>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto">
        {/* Title */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="skeleton w-28 h-6" />
          <div className="flex gap-2">
            <div className="skeleton w-16 h-8 rounded-lg" />
            <div className="skeleton w-16 h-8 rounded-lg" />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-1 mb-3">
          <div className="skeleton w-16 h-9 rounded-lg" />
          <div className="skeleton w-16 h-9 rounded-lg" />
          <div className="skeleton w-20 h-9 rounded-lg" />
        </div>

        {/* Categories */}
        <div className="px-4 mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton w-16 h-7 rounded-full" />
          ))}
        </div>

        {/* Grid */}
        <div className="px-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="skeleton aspect-square rounded-t-lg" style={{ borderRadius: "8px 8px 0 0" }} />
              <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-2">
                <div className="skeleton w-20 h-3 mb-1.5" />
                <div className="skeleton w-14 h-2.5 mb-1.5" />
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <div className="skeleton w-3 h-3 rounded-full" />
                    <div className="skeleton w-3 h-3 rounded-full" />
                  </div>
                  <div className="skeleton w-10 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
