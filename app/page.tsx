import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export const metadata = {
  title: "Closet — Your Fashion Social Platform",
  description: "Discover, share, and virtually try on outfits. Build your digital wardrobe with AI-powered styling.",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-500">Closet</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-xl transition-colors btn-press"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="animal-print-bg">
        <div className="max-w-5xl mx-auto px-4 py-24 sm:py-32 text-center">
          <div className="inline-block bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            AI-Powered Fashion Platform
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-6 animate-fade-in">
            Your Digital Wardrobe,
            <br />
            <span className="text-brand-500">Reimagined</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 animate-slide-up">
            Share outfits, build your virtual closet, try on clothes with AI,
            and get personalized styling advice — all in one app.
          </p>
          <div className="flex items-center justify-center gap-4 animate-slide-up">
            <Link
              href="/auth/register"
              className="text-base font-semibold text-white bg-brand-500 hover:bg-brand-600 px-8 py-3.5 rounded-xl transition-colors btn-press shadow-lg shadow-brand-500/25"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/auth/login"
              className="text-base font-medium text-gray-600 hover:text-gray-900 px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Everything You Need for Fashion
          </h3>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            From sharing daily fits to AI-powered try-ons, Closet brings your fashion life together.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "📱",
                title: "Social Feed",
                desc: "Share outfits, like, comment, and discover trending styles from the community.",
              },
              {
                icon: "👗",
                title: "Virtual Closet",
                desc: "Organize your wardrobe digitally. Track saved and purchased garments by category.",
              },
              {
                icon: "✨",
                title: "AI Try-On",
                desc: "See how clothes look on you with Google AI virtual try-on technology.",
              },
              {
                icon: "💬",
                title: "Style Assistant",
                desc: "Get personalized outfit recommendations from our AI fashion advisor.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:border-brand-200 transition-all"
              >
                <span className="text-3xl mb-4 block">{feature.icon}</span>
                <h4 className="font-bold mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How It Works
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Your Profile",
                desc: "Sign up, add your measurements, and upload a profile photo for virtual try-ons.",
              },
              {
                step: "2",
                title: "Build Your Closet",
                desc: "Save garments from posts, purchase items, or manually add your existing wardrobe.",
              },
              {
                step: "3",
                title: "Style & Share",
                desc: "Try on outfits virtually, get AI recommendations, and share your looks with the world.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-brand-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-brand-500/25">
                  {item.step}
                </div>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-500 animal-print-bg py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Fashion Game?
          </h3>
          <p className="text-brand-100 mb-8 max-w-xl mx-auto">
            Join thousands of fashion lovers building their digital wardrobe.
            Free to start, no credit card required.
          </p>
          <Link
            href="/auth/register"
            className="inline-block text-base font-semibold text-brand-600 bg-white hover:bg-gray-50 px-8 py-3.5 rounded-xl transition-colors btn-press shadow-lg"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Closet. Your Fashion Social Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
