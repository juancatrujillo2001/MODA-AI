"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

const STEPS = [
  { label: "Welcome", icon: "wave" },
  { label: "Measurements", icon: "ruler" },
  { label: "Photo", icon: "camera" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    profilePhoto: null as string | null,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profilePhoto: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          profilePhoto: formData.profilePhoto,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      router.push("/feed");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animal-print-bg">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i <= step
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${i < step ? "bg-brand-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mb-6">
            Step {step + 1} of {STEPS.length}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center animate-slide-up">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {firstName}!
              </h1>
              <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
                Let&apos;s set up your profile in a few quick steps. This helps us
                personalize your experience and enable virtual try-on.
              </p>

              <div className="space-y-3 text-left mb-8">
                {[
                  { icon: "📏", text: "Add your body measurements for better fit" },
                  { icon: "📸", text: "Upload a photo for virtual try-on" },
                  { icon: "✨", text: "Start building your digital closet" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-600">{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors btn-press"
              >
                Let&apos;s Go
              </button>
              <button
                onClick={() => router.push("/feed")}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 mt-2"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 1: Measurements */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-bold text-center mb-1">
                Body Measurements
              </h2>
              <p className="text-center text-sm text-gray-500 mb-6">
                Helps us recommend the right fit. You can skip this.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, height: e.target.value }))
                    }
                    placeholder="170"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, weight: e.target.value }))
                    }
                    placeholder="65"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors btn-press"
                >
                  Next
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Photo */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-bold text-center mb-1">
                Profile Photo
              </h2>
              <p className="text-center text-sm text-gray-500 mb-6">
                Used for virtual try-on and your profile.
              </p>

              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {formData.profilePhoto ? (
                    <Image
                      src={formData.profilePhoto}
                      alt="Profile preview"
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  )}
                </div>
                <label className="cursor-pointer text-sm text-brand-500 font-semibold hover:text-brand-600 px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors">
                  {formData.profilePhoto ? "Change Photo" : "Choose Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 btn-press"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={() => router.push("/feed")}
                  className="flex-1 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
