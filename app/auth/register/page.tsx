"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

/* ─── Types ─────────────────────────────────────────── */
interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface Measurements {
  chest: number;
  waist: number;
  hips: number;
  shoulders: number;
  armLength: number;
  inseam: number;
}

interface RecommendedSizes {
  shirts: string;
  pants: string;
  shoes: string;
}

/* ─── Estimate helpers ──────────────────────────────── */
function estimateMeasurements(
  height: number,
  weight: number,
  gender: string
): Measurements {
  const bmi = weight / ((height / 100) ** 2);
  const isMale = gender === "Hombre";
  return {
    chest: Math.round(isMale ? 88 + (bmi - 22) * 1.8 : 82 + (bmi - 22) * 1.6),
    waist: Math.round(isMale ? 78 + (bmi - 22) * 2.2 : 68 + (bmi - 22) * 2.0),
    hips: Math.round(isMale ? 94 + (bmi - 22) * 1.5 : 96 + (bmi - 22) * 1.8),
    shoulders: Math.round(isMale ? 44 + (height - 170) * 0.15 : 38 + (height - 160) * 0.12),
    armLength: Math.round(height * 0.33),
    inseam: Math.round(height * (isMale ? 0.45 : 0.44)),
  };
}

function estimateSizes(m: Measurements, gender: string): RecommendedSizes {
  const isMale = gender === "Hombre";
  let shirt = "M";
  if (m.chest < (isMale ? 90 : 84)) shirt = "S";
  else if (m.chest < (isMale ? 100 : 92)) shirt = "M";
  else if (m.chest < (isMale ? 110 : 100)) shirt = "L";
  else shirt = "XL";

  let pants = "M";
  if (m.waist < (isMale ? 78 : 68)) pants = "S";
  else if (m.waist < (isMale ? 86 : 76)) pants = "M";
  else if (m.waist < (isMale ? 94 : 84)) pants = "L";
  else pants = "XL";

  return { shirts: shirt, pants, shoes: isMale ? "42" : "38" };
}

/* ─── Page ──────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();

  /* Step state */
  const [step, setStep] = useState(1);

  /* Step 1 */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /* Step 2 */
  const [gender, setGender] = useState("Hombre");
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoSide, setPhotoSide] = useState<string | null>(null);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [analyzing, setAnalyzing] = useState(false);

  /* Step 3 */
  const [measurements, setMeasurements] = useState<Measurements | null>(null);
  const [recommendedSizes, setRecommendedSizes] = useState<RecommendedSizes | null>(null);

  /* General */
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  /* ─── Step 1 validation ─────────────────────────── */
  function validateStep1(): boolean {
    const errs: FieldErrors = {};

    if (!username.trim()) errs.username = "Nombre de usuario requerido";
    else if (username.length < 3) errs.username = "Minimo 3 caracteres";
    else if (!/^[a-zA-Z0-9._]+$/.test(username))
      errs.username = "Solo letras, numeros, puntos y guiones bajos";

    if (!email.trim()) errs.email = "Correo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Correo invalido";

    if (!password) errs.password = "Contrasena requerida";
    else if (password.length < 8) errs.password = "Minimo 8 caracteres";

    if (!confirmPassword) errs.confirmPassword = "Confirma tu contrasena";
    else if (password !== confirmPassword)
      errs.confirmPassword = "Las contrasenas no coinciden";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleStep1Continue() {
    if (validateStep1()) {
      setError("");
      setStep(2);
    }
  }

  /* ─── Photo upload ──────────────────────────────── */
  function handlePhoto(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string | null) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La foto debe ser menor a 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

  /* ─── Step 2: Analyze ───────────────────────────── */
  async function handleAnalyze() {
    if (!photoFront && !photoSide) {
      setError("Sube al menos una foto para el analisis");
      return;
    }
    setError("");
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 2000));
    const m = estimateMeasurements(height, weight, gender);
    const s = estimateSizes(m, gender);
    setMeasurements(m);
    setRecommendedSizes(s);
    setAnalyzing(false);
    setStep(3);
  }

  function handleSkipBiometrics() {
    const m = estimateMeasurements(170, 70, "Hombre");
    const s = estimateSizes(m, "Hombre");
    setMeasurements(m);
    setRecommendedSizes(s);
    setStep(3);
  }

  /* ─── Step 3: Create account ────────────────────── */
  async function handleCreateAccount() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: username,
          email: email.trim(),
          username: username.trim(),
          password,
          gender,
          height,
          weight,
          bodyMeasurements: { measurements, recommendedSizes },
          profilePhoto: photoFront || undefined,
          avatar: photoSide || undefined,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Error del servidor. Intenta de nuevo.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta");
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Shared styles ─────────────────────────────── */
  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

  const primaryBtnClass =
    "w-full py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  /* ─── Render ────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Main card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-center text-brand-500 mb-2">
            Closet
          </h1>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    s === step
                      ? "bg-brand-500 text-white"
                      : s < step
                        ? "bg-brand-100 text-brand-500"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s < step ? "\u2713" : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      s < step ? "bg-brand-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step labels */}
          <p className="text-xs text-gray-400 text-center mb-6">
            {step === 1 && "Cuenta"}
            {step === 2 && "Perfil corporal"}
            {step === 3 && "Tus tallas"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3 mb-4">
              {error}
            </div>
          )}

          {/* ═══════ STEP 1 — Account ═══════ */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                />
                {fieldErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Correo electronico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Confirmar contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <button onClick={handleStep1Continue} className={primaryBtnClass}>
                Continuar
              </button>
            </div>
          )}

          {/* ═══════ STEP 2 — Body Profile ═══════ */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              {/* Gender */}
              <div className="grid grid-cols-3 gap-2">
                {["Hombre", "Mujer", "Otro"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      gender === g
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Photo uploads */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 text-center">Foto frontal</p>
                  <button
                    onClick={() => frontInputRef.current?.click()}
                    className="w-full aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg hover:border-brand-300 transition-colors cursor-pointer overflow-hidden relative"
                  >
                    {photoFront ? (
                      <Image src={photoFront} alt="Frontal" fill className="object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl text-gray-300 absolute inset-0 flex items-center justify-center">+</span>
                    )}
                  </button>
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhoto(e, setPhotoFront)}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 text-center">Foto lateral</p>
                  <button
                    onClick={() => sideInputRef.current?.click()}
                    className="w-full aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg hover:border-brand-300 transition-colors cursor-pointer overflow-hidden relative"
                  >
                    {photoSide ? (
                      <Image src={photoSide} alt="Lateral" fill className="object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl text-gray-300 absolute inset-0 flex items-center justify-center">+</span>
                    )}
                  </button>
                  <input
                    ref={sideInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhoto(e, setPhotoSide)}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Height */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Estatura</span>
                  <span className="text-sm font-semibold text-brand-500">{height} cm</span>
                </div>
                <input
                  type="range"
                  min={140}
                  max={210}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-brand-500 h-1.5"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>140 cm</span>
                  <span>210 cm</span>
                </div>
              </div>

              {/* Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Peso</span>
                  <span className="text-sm font-semibold text-brand-500">{weight} kg</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={150}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-brand-500 h-1.5"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>40 kg</span>
                  <span>150 kg</span>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className={primaryBtnClass}
              >
                {analyzing ? "Analizando..." : "Analizar medidas"}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Atras
                </button>
                <button
                  onClick={handleSkipBiometrics}
                  className="flex-1 py-2.5 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
                >
                  Saltar
                </button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 3 — Results ═══════ */}
          {step === 3 && measurements && recommendedSizes && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-center">
                <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-1">
                  Analisis completo
                </span>
              </div>

              {/* Measurements card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">Medidas estimadas</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Pecho", measurements.chest],
                    ["Cintura", measurements.waist],
                    ["Caderas", measurements.hips],
                    ["Hombros", measurements.shoulders],
                    ["Brazo", measurements.armLength],
                    ["Entrepierna", measurements.inseam],
                  ] as [string, number][]).map(([label, val]) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-bold text-gray-900">{val}</p>
                      <p className="text-[11px] text-gray-400">{label} (cm)</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes card */}
              <div className="bg-brand-500 rounded-lg p-4 text-white">
                <p className="text-xs font-medium text-white/70 mb-3">Tallas recomendadas</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Camisas", recommendedSizes.shirts],
                    ["Pantalones", recommendedSizes.pants],
                    ["Calzado", recommendedSizes.shoes],
                  ] as [string, string][]).map(([label, size]) => (
                    <div key={label} className="text-center">
                      <p className="text-2xl font-bold">{size}</p>
                      <p className="text-[11px] text-white/70">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Volver a calibrar
              </button>
            </div>
          )}
        </div>

        {/* Bottom card — same as login */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4 text-center text-sm">
          Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-brand-500 font-semibold">
            Iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
