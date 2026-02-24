"use client";

import { useEffect, useMemo, useState } from "react";

/* -------------------- TYPES -------------------- */
type Band = "Low" | "Moderate" | "High";
type OilKey = "A" | "B" | "C" | "D";
type MoistureKey = "A" | "B" | "C" | "D";
type RednessKey = "A" | "B" | "C" | "D";
type EnvKey = "A" | "B" | "C";

type Inputs = {
  oilQ?: OilKey;
  moistureQ?: MoistureKey;
  rednessQ?: RednessKey;
  envQ?: EnvKey;
};

type RoutineStep = {
  title: string;
  why?: string;
};

type Analysis = {
  skinType:
    | "Oily + Dehydrated"
    | "Oily + Sensitive"
    | "Dry + Sensitive"
    | "Oily"
    | "Dry"
    | "Sensitive"
    | "Balanced"
    | "Balanced + Dehydrated";
  primaryFocus: string;
  concerns: string[];
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  notes: string[];
  climateBand: Band;
  climateNote: string;
  nextSteps: string[];
};

/* -------------------- CONSTANTS -------------------- */
const APP_NAME = "AeraInsight";
const LS_LAST_SCAN = "aerainsight_last_scan";
const LS_WAITLIST = "aerainsight_waitlist_emails";

/* Answer → score */
const scoreMap: Record<OilKey | MoistureKey | RednessKey, number> = {
  A: 20,
  B: 40,
  C: 65,
  D: 85,
};

/* Labels (for “Your inputs”) */
const labelMap = {
  oil: {
    A: "Not oily",
    B: "Slight shine",
    C: "Clearly oily",
    D: "Very oily",
  },
  moisture: {
    A: "Tight / flaky",
    B: "Slightly tight",
    C: "Comfortable",
    D: "Soft & plump",
  },
  redness: {
    A: "Rarely",
    B: "Sometimes",
    C: "Often",
    D: "Very easily",
  },
  env: {
    A: "Mostly indoors (AC)",
    B: "In/out frequently (AC shock)",
    C: "Mostly outdoors (UV/heat)",
  },
} as const;

/* Explainability */
const whyMap: Record<Analysis["skinType"], string> = {
  "Oily + Dehydrated":
    "Your skin produces noticeable oil, but it also shows signs of dehydration. This often happens when the barrier is stressed (common with AC + heat), so the skin over-produces oil to compensate.",
  "Oily + Sensitive":
    "Your skin produces oil but also reacts easily. This often indicates a stressed barrier rather than “strong oily skin”, so calming + consistency matters more than strong actives.",
  "Dry + Sensitive":
    "Your skin shows dryness and reactivity, which often signals a weakened barrier. Gentle hydration and barrier repair should come before any active treatments.",
  Oily:
    "Your skin produces more oil than average, increasing congestion risk. The goal is balance without stripping — over-cleansing can worsen oiliness.",
  Dry:
    "Your skin lacks moisture and likely has a weaker barrier. Hydration and barrier support help reduce tightness and prevent irritation.",
  Sensitive:
    "Your skin reacts easily, often due to irritation or inflammation. Calming the barrier and avoiding triggers helps restore stability.",
  Balanced:
    "Your skin appears fairly balanced. The focus is maintenance: gentle cleansing, hydration, and daily sun protection.",
  "Balanced + Dehydrated":
    "Your oil levels look balanced, but your skin shows dehydration signs. In AC / warm environments this is common — hydration and barrier support help prevent sensitivity.",
};

const avoidMap: Record<Analysis["skinType"], string[]> = {
  "Oily + Dehydrated": [
    "Harsh foaming cleansers that leave skin tight",
    "Over-washing (more than 2× daily)",
    "Strong exfoliants too frequently (AHA/BHA/peels)",
  ],
  "Oily + Sensitive": [
    "Scrubs or harsh cleansers",
    "Strong actives until redness settles",
    "Layering too many new products at once",
  ],
  "Dry + Sensitive": [
    "Hot water and harsh cleansers",
    "Strong actives until skin stabilizes",
    "Fragrance-heavy products if irritation is frequent",
  ],
  Oily: [
    "Over-cleansing (more than 2× daily)",
    "Alcohol-heavy toners",
    "Scrubs that inflame pores",
  ],
  Dry: ["Foaming cleansers that leave skin tight", "Skipping moisturizer", "Over-exfoliating"],
  Sensitive: [
    "Strong actives until stable",
    "Scrubs or rough exfoliation",
    "Trying multiple new products at once",
  ],
  "Balanced + Dehydrated": ["Harsh foaming cleansers", "Over-washing", "Frequent strong exfoliation"],
  Balanced: ["Over-exfoliating", "Switching products too often", "Skipping sunscreen"],
};

/* -------------------- CORE LOGIC -------------------- */
function buildRoutines(
  skinType: Analysis["skinType"],
  climateBand: Band
): { am: RoutineStep[]; pm: RoutineStep[] } {
  const climateWhy =
    climateBand === "High"
      ? "Environment stress is higher right now, so keep steps protective and conservative."
      : climateBand === "Moderate"
      ? "Some environment stress today — focus on hydration + consistency."
      : "Lower environment stress — keep the routine steady and simple.";

  // Base steps (safe, universal)
  const amBase: RoutineStep[] = [
    { title: "Gentle cleanser", why: "Cleans without stripping the barrier." },
    { title: "Hydrating serum", why: "Supports hydration to reduce tightness and rebound oil." },
    { title: "Moisturizer", why: "Strengthens the barrier so skin is less reactive to swings." },
    {
      title: "Sunscreen SPF 50",
      why: "UV + heat can amplify irritation and pigmentation risk — protect daily.",
    },
  ];

  const pmBase: RoutineStep[] = [
    { title: "Gentle cleanser", why: "Remove buildup without aggravating the barrier." },
    {
      title: "Barrier-repair moisturizer",
      why: "Recovery mode: prioritize barrier support before strong actives.",
    },
  ];

  // Small, real differentiation (still MVP-safe)
  if (skinType === "Oily") {
    return {
      am: [
        { title: "Gentle cleanser", why: "Prevents buildup without over-stripping." },
        { title: "Light hydrating serum", why: "Hydration helps reduce oil rebound." },
        { title: "Lightweight moisturizer", why: "Barrier support without heaviness." },
        { title: "Sunscreen SPF 50 (matte if preferred)", why: "Protection without clogging feel." },
      ],
      pm: [
        { title: "Gentle cleanser", why: "Avoid harsh cleansers that trigger rebound oil." },
        { title: "Barrier-support moisturizer (light)", why: climateWhy },
      ],
    };
  }

  if (skinType === "Dry") {
    return {
      am: [
        { title: "Gentle cleanser (or rinse)", why: "Avoid stripping already-dry skin." },
        { title: "Hydrating serum", why: "Reduces tightness and supports barrier water balance." },
        { title: "Richer moisturizer", why: "Improves comfort and reduces flaking." },
        { title: "Sunscreen SPF 50", why: "UV worsens dryness + irritation over time." },
      ],
      pm: [
        { title: "Gentle cleanser", why: "Keep it non-foaming if possible." },
        { title: "Barrier-repair moisturizer (richer)", why: climateWhy },
      ],
    };
  }

  if (skinType === "Sensitive" || skinType === "Oily + Sensitive" || skinType === "Dry + Sensitive") {
    return {
      am: [
        { title: "Gentle cleanser", why: "Minimizes irritation triggers." },
        { title: "Hydrating serum", why: "Hydration supports calm barrier function." },
        { title: "Moisturizer", why: "Barrier support reduces reactivity." },
        { title: "Sunscreen SPF 50", why: "UV can worsen redness and sensitivity." },
      ],
      pm: [
        { title: "Gentle cleanser", why: "No scrubs, no harsh foams." },
        { title: "Barrier-repair moisturizer", why: "Keep it simple until stable." },
      ],
    };
  }

  if (skinType === "Oily + Dehydrated" || skinType === "Balanced + Dehydrated") {
    return {
      am: [
        { title: "Gentle cleanser", why: "Avoid stripping, which worsens dehydration." },
        { title: "Hydrating serum", why: "Directly targets dehydration signals." },
        { title: "Moisturizer", why: "Barrier support lowers compensation oil." },
        { title: "Sunscreen SPF 50", why: "UV/heat can worsen dehydration + irritation." },
      ],
      pm: [
        { title: "Gentle cleanser", why: "Keep it mild to prevent barrier stress." },
        { title: "Barrier-repair moisturizer", why: climateWhy },
      ],
    };
  }

  // Balanced (default)
  return { am: amBase, pm: pmBase };
}

function analyzeSkin(oil: number, moisture: number, redness: number, env: EnvKey): Analysis {
  const oily = oil >= 65;
  const dehydrated = moisture <= 45;
  const dry = moisture <= 35;
  const sensitive = redness >= 60;

  // Skin type
  let skinType: Analysis["skinType"] = "Balanced";
  if (oily && dehydrated) skinType = "Oily + Dehydrated";
  else if (dry && sensitive) skinType = "Dry + Sensitive";
  else if (oily && sensitive) skinType = "Oily + Sensitive";
  else if (oily) skinType = "Oily";
  else if (dry) skinType = "Dry";
  else if (sensitive) skinType = "Sensitive";
  else if (dehydrated) skinType = "Balanced + Dehydrated";

  // Primary focus
  let primaryFocus = "Maintenance & prevention";
  if (sensitive) primaryFocus = "Barrier calming & redness control";
  else if (dehydrated || dry) primaryFocus = "Hydration & barrier repair";
  else if (oily) primaryFocus = "Oil balance (without stripping)";

  // Environment load (MVP: manual exposure, not live weather)
  let climateBand: Band = "Low";
  let climateNote = "Lower exposure today — keep your routine consistent.";
  const barrierRisk = sensitive || dehydrated || dry;

  if (env === "A") {
    climateBand = "Moderate";
    climateNote = barrierRisk
      ? "Mostly indoors (AC): can dry and irritate the barrier. Keep routine gentle and hydrating for the next few days."
      : "Mostly indoors (AC): add hydration to maintain balance over the next few days.";
  } else if (env === "B") {
    climateBand = "High";
    climateNote = barrierRisk
      ? "In/out frequently: AC shock can trigger sensitivity. Keep it conservative for the next few days; avoid strong actives."
      : "In/out frequently: AC shock exposure. Keep routine simple and consistent for the next few days.";
  } else if (env === "C") {
    climateBand = "High";
    climateNote = barrierRisk
      ? "Mostly outdoors: UV/heat can worsen irritation. SPF is non-negotiable; keep actives conservative for the next few days."
      : "Mostly outdoors: UV/heat exposure. SPF is essential; don’t overdo actives for the next few days.";
  }

  // Concerns
  const concerns: string[] = [];
  if (oily) concerns.push("Oil control / congestion risk");
  if (dry || dehydrated) concerns.push("Dehydration / barrier support");
  if (sensitive) concerns.push("Redness / sensitivity");
  if (concerns.length === 0) concerns.push("Maintenance / prevention");

  // Routines (differentiated but still minimal)
  const routines = buildRoutines(skinType, climateBand);

  // Notes
  const notes: string[] = [];
  if (sensitive) notes.push("Keep routine simple. Avoid strong actives for now.");
  if (oily) notes.push("Avoid over-cleansing. Oil rebound risk.");
  if (dehydrated) notes.push("AC / warm environments can increase dehydration risk.");

  // Continuity hook (return pull)
  const nextSteps = [
    "Over the next 7–14 days, consistent barrier support often reduces reactivity.",
    "If tightness or breakouts appear, the routine should be adjusted rather than intensified.",
    "Environment exposure can shift skin needs week to week — a brief check-in helps.",
  ];

  return {
    skinType,
    primaryFocus,
    concerns,
    amRoutine: routines.am,
    pmRoutine: routines.pm,
    notes,
    climateBand,
    climateNote,
    nextSteps,
  };
}

/* -------------------- HELPERS -------------------- */
function isValidEmail(email: string) {
  // MVP-level validation (simple, not perfect)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function pushEmailToWaitlist(email: string) {
  const clean = email.trim().toLowerCase();
  const raw = localStorage.getItem(LS_WAITLIST);
  const list: string[] = raw ? JSON.parse(raw) : [];
  if (!list.includes(clean)) list.push(clean);
  localStorage.setItem(LS_WAITLIST, JSON.stringify(list));
}

/* -------------------- PAGE -------------------- */
export default function ScanPage() {
  const [oilQ, setOilQ] = useState<OilKey | undefined>(undefined);
  const [moistureQ, setMoistureQ] = useState<MoistureKey | undefined>(undefined);
  const [rednessQ, setRednessQ] = useState<RednessKey | undefined>(undefined);
  const [envQ, setEnvQ] = useState<EnvKey | undefined>(undefined);

  const canAnalyze = Boolean(oilQ && moistureQ && rednessQ && envQ);

  const [result, setResult] = useState<Analysis | null>(null);
  const [savedInputs, setSavedInputs] = useState<Inputs | null>(null);

  const [email, setEmail] = useState("");
  const [emailSavedMsg, setEmailSavedMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  /* Load saved scan */
  useEffect(() => {
    const saved = localStorage.getItem(LS_LAST_SCAN);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { analysis?: Analysis; inputs?: Inputs };
      if (parsed?.analysis) setResult(parsed.analysis);
      if (parsed?.inputs) {
        setSavedInputs(parsed.inputs);
        setOilQ(parsed.inputs.oilQ);
        setMoistureQ(parsed.inputs.moistureQ);
        setRednessQ(parsed.inputs.rednessQ);
        setEnvQ(parsed.inputs.envQ);
      }
    } catch {
      localStorage.removeItem(LS_LAST_SCAN);
    }
  }, []);

  const inputSummary = useMemo(() => {
    return {
      oil: oilQ ? labelMap.oil[oilQ] : "-",
      moisture: moistureQ ? labelMap.moisture[moistureQ] : "-",
      redness: rednessQ ? labelMap.redness[rednessQ] : "-",
      env: envQ ? labelMap.env[envQ] : "-",
    };
  }, [oilQ, moistureQ, rednessQ, envQ]);

  function handleAnalyze() {
    if (!canAnalyze || !oilQ || !moistureQ || !rednessQ || !envQ) return;

    const analysis = analyzeSkin(scoreMap[oilQ], scoreMap[moistureQ], scoreMap[rednessQ], envQ);
    const inputs: Inputs = { oilQ, moistureQ, rednessQ, envQ };

    setResult(analysis);
    setSavedInputs(inputs);
    setEmailSavedMsg(null);
    setEmailError(null);

    localStorage.setItem(
      LS_LAST_SCAN,
      JSON.stringify({
        analysis,
        inputs,
        timestamp: Date.now(),
      })
    );
  }

  function clearSavedScan() {
    localStorage.removeItem(LS_LAST_SCAN);
    setResult(null);
    setSavedInputs(null);
    setEmail("");
    setEmailSavedMsg(null);
    setEmailError(null);
  }

  function handleSaveEmail() {
    setEmailSavedMsg(null);
    setEmailError(null);

    if (!email.trim()) {
      setEmailError("Please enter your email.");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    pushEmailToWaitlist(email);
    setEmailSavedMsg("Saved. You’ll get the next skin brief (beta).");
    setEmail("");
  }

  return (
    <main className="min-h-screen bg-black text-white flex justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold mb-2 text-center">{APP_NAME} Skin Scan (MVP)</h1>

        <p className="text-sm text-slate-400 text-center mb-8">
          Get a safe, personalized routine and what to avoid — in ~60 seconds.
        </p>

        {/* LAST SCAN BANNER */}
        {result && (
          <div className="mb-4 p-4 rounded bg-slate-950 border border-slate-700 text-sm text-slate-300">
            <p className="text-slate-400">Last scan</p>
            <p>
              {result.skinType} · Environment load: {result.climateBand}
            </p>
            <button onClick={clearSavedScan} className="mt-2 text-xs text-slate-400 underline">
              Clear saved scan
            </button>
          </div>
        )}

        {/* QUIZ CONTEXT LINE */}
        <div className="mb-6 p-4 rounded bg-slate-950 border border-slate-700 text-sm text-slate-300">
          These answers help us model oil balance, barrier stress, and environmental exposure — so the guidance is
          conservative and safe.
        </div>

        {/* QUESTION 1 */}
        <div className="mb-6">
          <p className="mb-2">How oily does your skin feel by midday?</p>
          {(["A", "B", "C", "D"] as const).map((k) => (
            <label key={k} className="block mb-1">
              <input
                type="radio"
                name="oil"
                value={k}
                checked={oilQ === k}
                onChange={() => setOilQ(k)}
              />{" "}
              {labelMap.oil[k]}
            </label>
          ))}
        </div>

        {/* QUESTION 2 */}
        <div className="mb-6">
          <p className="mb-2">How does your skin feel after washing?</p>
          {(["A", "B", "C", "D"] as const).map((k) => (
            <label key={k} className="block mb-1">
              <input
                type="radio"
                name="moisture"
                value={k}
                checked={moistureQ === k}
                onChange={() => setMoistureQ(k)}
              />{" "}
              {labelMap.moisture[k]}
            </label>
          ))}
        </div>

        {/* QUESTION 3 */}
        <div className="mb-6">
          <p className="mb-2">How easily does your skin get red or irritated?</p>
          {(["A", "B", "C", "D"] as const).map((k) => (
            <label key={k} className="block mb-1">
              <input
                type="radio"
                name="redness"
                value={k}
                checked={rednessQ === k}
                onChange={() => setRednessQ(k)}
              />{" "}
              {labelMap.redness[k]}
            </label>
          ))}
        </div>

        {/* QUESTION 4 */}
        <div className="mb-6">
          <p className="mb-2">What’s your environment exposure lately?</p>
          <p className="text-xs text-slate-400 mb-2">
            MVP note: this is manual input — we’re not pulling live weather yet. The guidance is meant to be useful
            for the next few days, not just one moment.
          </p>

          {(["A", "B", "C"] as const).map((k) => (
            <label key={k} className="block mb-1">
              <input type="radio" name="env" value={k} checked={envQ === k} onChange={() => setEnvQ(k)} />{" "}
              {labelMap.env[k]}
            </label>
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className={`w-full py-3 rounded font-medium ${
            canAnalyze ? "bg-white text-black" : "bg-slate-700 text-slate-300 cursor-not-allowed"
          }`}
        >
          Start my scan
        </button>

        {!canAnalyze && (
          <p className="mt-3 text-xs text-slate-400 text-center">Please answer all questions to continue.</p>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-8 p-5 bg-slate-900 border border-slate-700 rounded">
            <h2 className="text-xl font-semibold">{result.skinType}</h2>

            <p className="mt-2 text-sm text-slate-300">
              {result.skinType.includes("Oily")
                ? "This means your skin needs balance — not aggressive oil stripping."
                : result.skinType.includes("Dry") || result.skinType.includes("Dehydrated")
                ? "This means your skin likely needs barrier support before stronger treatments."
                : result.skinType.includes("Sensitive")
                ? "This means calming + consistency matter more than adding new actives."
                : "This means a steady, simple routine is your best advantage right now."}
            </p>

            {/* INPUT SUMMARY */}
            <div className="mt-3 p-4 rounded bg-slate-950 border border-slate-700 text-sm">
              <p className="text-slate-400 mb-2">Your inputs</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>Oil: {inputSummary.oil}</li>
                <li>After wash: {inputSummary.moisture}</li>
                <li>Redness: {inputSummary.redness}</li>
                <li>Environment: {inputSummary.env}</li>
              </ul>
            </div>

            {/* PRIMARY FOCUS */}
            <div className="mt-4 mb-4 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Primary focus right now</p>
              <p className="text-lg font-semibold">{result.primaryFocus}</p>
            </div>

            {/* ENVIRONMENT LOAD */}
            <div className="mt-4 mb-4 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Environment load (MVP)</p>
              <p className="text-lg font-semibold">{result.climateBand}</p>
              <p className="text-sm text-slate-300 mt-2">{result.climateNote}</p>
            </div>

            {/* WHY THIS RESULT */}
            <div className="mt-4 text-sm text-slate-300">
              <p className="font-medium mb-1">Why this result?</p>
              <p>{whyMap[result.skinType] ?? whyMap.Balanced}</p>
            </div>

            {/* WHAT NOT TO DO */}
            <div className="mt-4">
              <strong>What to avoid (for the next 2–3 weeks)</strong>
              <ul className="list-disc pl-5 text-sm text-slate-400 mt-2">
                {(avoidMap[result.skinType] ?? avoidMap.Balanced).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {/* CONCERNS */}
            <ul className="mt-4 list-disc pl-5">
              {result.concerns.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>

            {/* AM ROUTINE */}
            <div className="mt-5">
              <strong>AM Routine</strong>
              <ol className="list-decimal pl-5 mt-2 space-y-2">
                {result.amRoutine.map((step) => (
                  <li key={step.title}>
                    <div>{step.title}</div>
                    {step.why && <div className="text-sm text-slate-400 mt-1">{step.why}</div>}
                  </li>
                ))}
              </ol>
            </div>

            {/* PM ROUTINE */}
            <div className="mt-5">
              <strong>PM Routine</strong>
              <ol className="list-decimal pl-5 mt-2 space-y-2">
                {result.pmRoutine.map((step) => (
                  <li key={step.title}>
                    <div>{step.title}</div>
                    {step.why && <div className="text-sm text-slate-400 mt-1">{step.why}</div>}
                  </li>
                ))}
              </ol>
            </div>

            {/* NOTES */}
            <ul className="mt-5 list-disc pl-5 text-sm text-slate-300">
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>

            {/* CONTINUITY HOOK */}
            <div className="mt-6 p-4 rounded bg-slate-950 border border-slate-700">
              <p className="font-medium mb-2">What usually happens next</p>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                {result.nextSteps.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>

              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-2">Get my next skin brief (beta)</p>
                <div className="flex gap-2">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 bg-black border border-slate-700 rounded px-3 py-2 text-sm text-white"
                    inputMode="email"
                    autoComplete="email"
                  />
                  <button onClick={handleSaveEmail} className="bg-white text-black px-4 py-2 rounded text-sm">
                    Save
                  </button>
                </div>

                {emailError && <p className="text-xs text-red-400 mt-2">{emailError}</p>}
                {emailSavedMsg && <p className="text-xs text-emerald-400 mt-2">{emailSavedMsg}</p>}

                <p className="text-xs text-slate-500 mt-2">
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500 text-center">
          MVP demo only. Not medical advice.
        </p>

        {/* tiny dev hint (safe) */}
        {savedInputs && (
          <p className="mt-2 text-[10px] text-slate-600 text-center">
            Saved locally: {savedInputs.oilQ ?? "-"} {savedInputs.moistureQ ?? "-"} {savedInputs.rednessQ ?? "-"}{" "}
            {savedInputs.envQ ?? "-"}
          </p>
        )}
      </div>
    </main>
  );
}