import Link from "next/link";

export const metadata = {
  title: "404 — Page Not Found | Closet",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="text-8xl font-bold text-brand-100 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/feed"
            className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-6 py-2.5 rounded-xl transition-colors btn-press"
          >
            Go to Feed
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-6 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
