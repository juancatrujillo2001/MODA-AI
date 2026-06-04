"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function Landing() {
  const tools = [
    { title: "Explorador Inteligente", desc: "Descubre outfits con visión artificial avanzada.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { title: "Scanner de Outfits", desc: "Identifica prendas y estilos automáticamente.", icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" },
    { title: "Closet Virtual", desc: "Gestión digital de tu inventario personal.", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
    { title: "Avatar AI Try-On", desc: "Prueba outfits en tu gemelo digital.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { title: "Recomendaciones", desc: "Estilismo basado en biometría y gustos.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const heroImages = [
    { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80", label: "Street Style" },
    { url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80", label: "Casual Chic" },
    { url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80", label: "Editorial Look" },
    { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80", label: "Urban Fashion" },
    { url: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80", label: "Minimalist Vibe" },
    { url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80", label: "Trendy Outfit" },
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevImageIndex, setPrevImageIndex] = useState(0);

  const goToImage = useCallback((index: number) => {
    if (index === currentImageIndex) return;
    setIsTransitioning(true);
    setPrevImageIndex(currentImageIndex);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 600);
  }, [currentImageIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setPrevImageIndex(currentImageIndex);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        setIsTransitioning(false);
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentImageIndex, heroImages.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[#0a0a0f] min-h-screen font-sans selection:bg-purple-500/20 selection:text-purple-300">
      {/* ═══ NAVBAR ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,10,15,0.8)] backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={scrollToTop}
            className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            Closet
          </button>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-sm font-medium text-gray-500 hover:text-white transition-colors duration-150 tracking-wide">
              Nosotros
            </a>
            <a href="#tools" className="text-sm font-medium text-gray-500 hover:text-white transition-colors duration-150 tracking-wide">
              Herramientas AI
            </a>
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-white transition-colors duration-150 tracking-wide">
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all duration-200"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative min-h-screen bg-[#0a0a0f] flex items-center overflow-hidden pt-20">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[120px] animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left — copy */}
          <div className="space-y-8 animate-fadeInUp">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Plataforma de moda con IA
            </div>

            <h2 className="text-6xl md:text-8xl font-black leading-none tracking-tight">
              <span className="text-white">Explora,</span>
              <br />
              <span className="text-white">guarda </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmerGradient">
                y prueba
              </span>
            </h2>

            <p className="text-lg text-gray-400 leading-relaxed max-w-md font-light">
              La plataforma de moda definitiva impulsada por Inteligencia Artificial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-base shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:-translate-y-1 transition-all duration-200 active:scale-95 animate-glow"
              >
                Crear cuenta gratis
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/[0.1] text-gray-300 font-semibold text-base hover:bg-white/[0.05] hover:border-white/[0.2] transition-all duration-200"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          {/* Right — image slideshow */}
          <div className="relative animate-float">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-white/[0.08]">
              {/* Hero Image Slideshow */}
              <div className="relative w-full h-full">
                {/* Previous image (fading out) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`prev-${prevImageIndex}`}
                  src={heroImages[prevImageIndex].url}
                  alt="Fashion outfit"
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                    isTransitioning ? "opacity-100 scale-105" : "opacity-0 scale-100"
                  }`}
                />

                {/* Current image (fading in) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`current-${currentImageIndex}`}
                  src={heroImages[currentImageIndex].url}
                  alt="Fashion outfit"
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                    isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

                {/* Dots indicators */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentImageIndex
                          ? "w-6 h-1.5 bg-white"
                          : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>

                {/* AI Scan badge */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="bg-[rgba(10,10,15,0.85)] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="text-[11px] font-bold tracking-widest uppercase text-purple-400">
                        Live AI Scan
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-snug">
                      <span className="text-white font-semibold">{heroImages[currentImageIndex].label}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE PLATFORM ═══ */}
      <section id="about" className="relative bg-[#0a0a0f] py-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(168,85,247,0.07),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-6 space-y-6">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-purple-400 mb-6">
            The Platform
          </p>
          <h3 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-3xl mx-auto">
            Closet es el nexo entre la visión social y la ingeniería de estilo.
          </h3>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
            Combinamos exploración social, biometría digital y modelos de lenguaje masivo para democratizar la moda de alta gama.
          </p>
        </div>
      </section>

      {/* ═══ ECOSISTEMA AI ═══ */}
      <section id="tools" className="relative bg-[#0a0a0f] py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,85,247,0.1),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-purple-400 mb-4">
              Core Tools
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Ecosistema AI
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Herramientas inteligentes que transforman tu experiencia con la moda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {tools.map((tool, idx) => (
              <div
                key={idx}
                className="group relative bg-[#111118] border border-white/[0.07] rounded-[24px] p-8 hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                  </svg>
                </div>
                <h5 className="relative text-lg font-bold text-white mb-2 tracking-tight">
                  {tool.title}
                </h5>
                <p className="relative text-sm text-gray-500 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="relative bg-[#0a0a0f] py-32 overflow-hidden px-6">
        <div className="relative max-w-4xl mx-auto text-center px-8 py-24 rounded-[32px] bg-gradient-to-br from-purple-950/50 via-transparent to-pink-950/30 border border-white/[0.06] backdrop-blur-sm overflow-hidden">
          {/* Decorative lines */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />

          <div className="relative space-y-10">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none">
              ¿Listo para
              <br />
              el futuro?
            </h2>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:-translate-y-1 transition-all duration-200 mt-10 active:scale-95"
            >
              Empieza ahora
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0a0a0f] border-t border-white/[0.06] py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <button
            onClick={scrollToTop}
            className="text-xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            Closet
          </button>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
              Privacidad
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
              Términos
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
              Contacto
            </a>
          </div>
          <div className="text-xs text-gray-700">
            © 2026 Closet. Digital Fashion Engineering.
          </div>
        </div>
      </footer>
    </div>
  );
}
