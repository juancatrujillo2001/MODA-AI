export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header skeleton */}
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border-b border-gray-200 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            {/* Post header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="skeleton w-9 h-9 rounded-full" />
              <div className="flex-1">
                <div className="skeleton w-24 h-3.5 mb-1.5" />
                <div className="skeleton w-16 h-2.5" />
              </div>
            </div>
            {/* Image */}
            <div className="skeleton w-full aspect-square" style={{ borderRadius: 0 }} />
            {/* Actions */}
            <div className="px-4 py-3">
              <div className="flex gap-4 mb-2">
                <div className="skeleton w-6 h-6 rounded" />
                <div className="skeleton w-6 h-6 rounded" />
                <div className="skeleton w-6 h-6 rounded" />
              </div>
              <div className="skeleton w-20 h-3 mb-2" />
              <div className="skeleton w-48 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
