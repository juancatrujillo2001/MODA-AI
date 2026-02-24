export default function SearchLoading() {
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

      <div className="max-w-screen-md mx-auto px-4 pt-4">
        <div className="skeleton w-full h-10 rounded-lg mb-4" />
        <div className="skeleton w-32 h-5 mb-3" />
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="skeleton aspect-square" style={{ animationDelay: `${i * 30}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
