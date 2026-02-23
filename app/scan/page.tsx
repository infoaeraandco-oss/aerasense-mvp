"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------- TYPES ---------- */
type ClimateBand = "Low" | "Moderate" | "High";

type RoutineStep = {
  title: string;
  why?: string;
};

type Analysis = {
  skinType: string;
  primaryFocus: string;
  concerns: string[];
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  notes: string[];
  climateBand: ClimateBand;
  climateNote: string;
};

const scoreMap: Record<string, number> = {
  A: 20,
  B: 40,
  C: 65,
  D: 85,
};

/* ---------- COPY MAPS ---------- */
const whyMap: Record<string, string> = {
  "Oily + Dehydrated":
    "You’re getting visible oil, but also dehydration signals. This often happens when the barrier is stressed (AC + heat/humidity shifts), which can trigger oil overproduction as compensation.",
  "Oily + Sensitive":
    "You’re producing oil but also reacting easily. This usually signals barrier stress more than “strong oily skin,” so calming and consistency matter more than strong actives.",
  "Dry + Sensitive":
    "Dryness + reactivity often means a weakened barrier. Gentle hydration and barrier repair should come before any active treatments.",
  Oily:
    "Your skin produces more oil than average, increasing congestion risk. The goal is balance without stripping — over-cleansing can worsen oiliness.",
  Dry:
    "Your skin lacks moisture and likely has a weaker barrier. Hydration and barrier support help reduce tightness and prevent irritation.",
  Sensitive:
    "Your skin reacts easily, often due to irritation or inflammation. Calming the barrier and avoiding triggers helps restore stability.",
  Balanced:
    "Your skin looks fairly balanced. The focus is maintenance: gentle cleansing, hydration, and daily sun protection.",
  "Balanced + Dehydrated":
    "Your oil balance looks okay, but dehydration signals are present. This can happen with AC exposure and environment swings — hydration and barrier support help prevent sensitivity.",
};

const avoidMap: Record<string, string[]> = {
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
    "Fragrance-heavy products",
  ],
  Oily: [
    "Over-cleansing (more than 2× daily)",
    "Alcohol-heavy toners",
    "Scrubs that inflame pores",
  ],
  Dry: [
    "Foaming cleansers that leave skin tight",
    "Skipping moisturizer",
    "Over-exfoliating",
  ],
  Sensitive: [
    "Strong actives until stable",
    "Scrubs or rough exfoliation",
    "Trying multiple new products at once",
  ],
  "Balanced + Dehydrated": [
    "Harsh foaming cleansers",
    "Over-washing",
    "Frequent strong exfoliation",
  ],
  Balanced: ["Over-exfoliating", "Switching products too often", "Skipping sunscreen"],
};

/* ---------- LABEL MAP ---------- */
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

type OilKey = keyof typeof labelMap.oil; // A|B|C|D
type MoistureKey = keyof typeof labelMap.moisture; // A|B|C|D
type RednessKey = keyof typeof labelMap.redness; // A|B|C|D
type EnvKey = keyof typeof labelMap.env; // A|B|C

/* ---------- ROUTINE BUILDER (dynamic) ---------- */
function buildRoutine(flags: {
  oily: boolean;
  dehydrated: boolean;
  dry: boolean;
  sensitive: boolean;
  env: EnvKey;
}): { am: RoutineStep[]; pm: RoutineStep[]; notes: string[] } {
  const { oily, dehydrated, dry, sensitive, env } = flags;

  const barrierRisk = sensitive || dehydrated || dry;

  // Base AM
  const am: RoutineStep[] = [
    {
      title: "Gentle cleanser",
      why: oily
        ? "Cleans without stripping (stripping can trigger oil rebound)."
        : "Keeps the barrier calm and avoids dryness.",
    },
  ];

  // Hydration / serum logic
  if (dehydrated || dry || barrierRisk) {
    am.push({
      title: "Hydrating serum",
      why: "To reduce dehydration signals and lower the chance of sensitivity or oil rebound.",
    });
  } else {
    // If not dehydrated, keep it light but still “intelligent”
    am.push({
      title: "Light hydration layer",
      why: "Supports daily balance without overloading the skin.",
    });
  }

  // Moisturizer type changes by skin
  if (oily && !dry) {
    am.push({
      title: "Moisturizer (light gel)",
      why: "Supports the barrier so your skin is less reactive to environment swings.",
    });
  } else {
    am.push({
      title: "Moisturizer (barrier-supporting)",
      why: "Helps reduce tightness and improves resilience over time.",
    });
  }

  // Sunscreen always
  am.push({
    title: "Sunscreen SPF 50",
    why:
      env === "C"
        ? "Outdoor exposure amplifies irritation and pigmentation risk — protect daily."
        : "Daily UV exposure still accumulates — protect consistently.",
  });

  // PM routine
  const pm: RoutineStep[] = [
    {
      title: "Gentle cleanser",
      why: "Removes sunscreen and buildup without stressing the barrier.",
    },
  ];

  // PM: decide between recovery mode vs simple maintenance
  if (barrierRisk) {
    pm.push({
      title: "Barrier-repair moisturizer",
      why: "Tonight is recovery mode: focus on barrier support before any strong actives.",
    });
  } else if (oily) {
    pm.push({
      title: "Moisturizer (light, non-stripping)",
      why: "Prevents dehydration that can trigger oil rebound.",
    });
  } else {
    pm.push({
      title: "Moisturizer (nourishing)",
      why: "Supports overnight recovery and reduces morning tightness.",
    });
  }

  // Notes
  const notes: string[] = [];

  if (sensitive) notes.push("Keep routine simple. Avoid strong actives until redness settles.");
  if (oily) notes.push("Avoid over-cleansing — it can increase oil rebound.");
  if (dehydrated || dry)
    notes.push("Environment swings (AC/heat/humidity shifts) can worsen dehydration signals.");

  if (env === "B" && barrierRisk) notes.push("AC shock day: keep products minimal and soothing.");
  if (env === "C") notes.push("Outdoor day: SPF is your #1 protection step.");

  return { am, pm, notes };
}

/* ---------- CORE ANALYSIS ---------- */
function analyzeSkin(
  oil: number,
  moisture: number,
  redness: number,
  env: EnvKey
): Analysis {
  const oily = oil >= 65;
  const dehydrated = moisture <= 45;
  const dry = moisture <= 35;
  const sensitive = redness >= 60;

  // Skin type
  let skinType = "Balanced";
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

  // Environment stress (NOT live weather)
  let climateBand: ClimateBand = "Low";
  let climateNote = "Maintain routine. Keep SPF consistent.";

  const barrierRisk = sensitive || dehydrated || dry;

  if (env === "A") {
    climateBand = "Moderate";
    climateNote = barrierRisk
      ? "Mostly indoors (AC): can dry and irritate the barrier. Keep routine gentle and hydrating."
      : "Mostly indoors (AC): hydration support helps maintain balance.";
  } else if (env === "B") {
    climateBand = "High";
    climateNote = barrierRisk
      ? "In/out frequently: environment swings can trigger sensitivity. Avoid strong actives today."
      : "In/out frequently: environment swing risk. Keep routine simple and consistent.";
  } else if (env === "C") {
    climateBand = "High";
    climateNote = barrierRisk
      ? "Mostly outdoors: UV/heat can worsen irritation. SPF is non-negotiable."
      : "Mostly outdoors: UV/heat stress. SPF is essential; avoid overdoing actives.";
  }

  // Concerns (simple MVP)
  const concerns: string[] = [];
  if (oily) concerns.push("Oil control / congestion risk");
  if (dry || dehydrated) concerns.push("Dehydration / barrier support");
  if (sensitive) concerns.push("Redness / sensitivity");
  if (concerns.length === 0) concerns.push("Maintenance / prevention");

  // Dynamic routines + notes
  const { am, pm, notes } = buildRoutine({ oily, dehydrated, dry, sensitive, env });

  return {
    skinType,
    primaryFocus,
    concerns,
    amRoutine: am,
    pmRoutine: pm,
    notes,
    climateBand,
    climateNote,
  };
}

/* ---------- STORAGE KEYS ---------- */
const LAST_SCAN_KEY = "aerasense_last_scan";
const BETA_EMAILS_KEY = "aerasense_beta_emails";

/* ---------- PAGE ---------- */
export default function ScanPage() {
  const [oilQ, setOilQ] = useState<OilKey | "">("");
  const [moistureQ, setMoistureQ] = useState<MoistureKey | "">("");
  const [rednessQ, setRednessQ] = useState<RednessKey | "">("");
  const [envQ, setEnvQ] = useState<EnvKey | "">("");

  const canAnalyze = Boolean(oilQ && moistureQ && rednessQ && envQ);

  const [result, setResult] = useState<Analysis | null>(null);
  const [savedInputs, setSavedInputs] = useState<{
    oilQ?: OilKey;
    moistureQ?: MoistureKey;
    rednessQ?: RednessKey;
    envQ?: EnvKey;
  } | null>(null);

  // Email capture
  const [email, setEmail] = useState("");
  const [emailSavedMsg, setEmailSavedMsg] = useState<string | null>(null);

  const inputSummary = useMemo(() => {
    return {
      oil: oilQ ? labelMap.oil[oilQ] : "-",
      moisture: moistureQ ? labelMap.moisture[moistureQ] : "-",
      redness: rednessQ ? labelMap.redness[rednessQ] : "-",
      env: envQ ? labelMap.env[envQ] : "-",
    };
  }, [oilQ, moistureQ, rednessQ, envQ]);

  /* Load saved scan on page load */
  useEffect(() => {
    const saved = localStorage.getItem(LAST_SCAN_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.analysis) setResult(parsed.analysis);
      if (parsed?.inputs) setSavedInputs(parsed.inputs);
    } catch {
      localStorage.removeItem(LAST_SCAN_KEY);
    }
  }, []);

  function handleAnalyze() {
    if (!canAnalyze) return;

    const analysis = analyzeSkin(
      scoreMap[oilQ as OilKey],
      scoreMap[moistureQ as MoistureKey],
      scoreMap[rednessQ as RednessKey],
      envQ as EnvKey
    );

    setResult(analysis);

    const inputs = { oilQ, moistureQ, rednessQ, envQ };

    localStorage.setItem(
      LAST_SCAN_KEY,
      JSON.stringify({
        analysis,
        inputs,
        timestamp: Date.now(),
      })
    );

    setSavedInputs(inputs);
    setEmailSavedMsg(null);
  }

  function clearSavedScan() {
    localStorage.removeItem(LAST_SCAN_KEY);
    setResult(null);
    setSavedInputs(null);
    setEmailSavedMsg(null);
  }

  function validateEmail(value: string) {
    // simple + strict enough for MVP
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function saveEmailForBeta() {
    setEmailSavedMsg(null);

    const clean = email.trim().toLowerCase();
    if (!validateEmail(clean)) {
      setEmailSavedMsg("Please enter a valid email.");
      return;
    }

    // store locally (MVP)
    const existingRaw = localStorage.getItem(BETA_EMAILS_KEY);
    const existing: any[] = existingRaw ? safeJson(existingRaw, []) : [];

    const payload = {
      email: clean,
      savedAt: Date.now(),
      lastResult: result
        ? {
            skinType: result.skinType,
            focus: result.primaryFocus,
            envStress: result.climateBand,
          }
        : null,
    };

    // prevent duplicates (keep latest)
    const filtered = existing.filter((x) => x?.email !== clean);
    filtered.unshift(payload);

    localStorage.setItem(BETA_EMAILS_KEY, JSON.stringify(filtered));

    setEmailSavedMsg("Saved. We’ll use this for Beta follow-up.");
    setEmail(clean);
  }

  function safeJson(raw: string, fallback: any) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold mb-2 text-center">AeraSense Skin Scan (MVP)</h1>

        <p className="text-xs text-slate-400 text-center mb-8">
          Answer 4 quick questions — we model oil balance, barrier stress, and today’s environment risk.
        </p>

        {/* LAST SCAN BANNER */}
        {result && (
          <div className="mb-6 p-4 rounded bg-slate-950 border border-slate-700 text-sm text-slate-300">
            <p className="text-slate-400">Last scan saved</p>
            <p className="mt-1">
              {result.skinType} · Environment stress: {result.climateBand}
            </p>
            <button
              onClick={clearSavedScan}
              className="mt-2 text-xs text-slate-400 underline"
            >
              Clear saved scan
            </button>
          </div>
        )}

        {/* QUESTION 1 */}
        <div className="mb-8">
          <p className="mb-3 font-medium">How oily does your skin feel by midday?</p>
          {(["A", "B", "C", "D"] as const).map((k) => (
            <label key={`oil-${k}`} className="block mb-2 text-slate-200">
              <input
                type="radio"
                name="oil"
                value={k}
                checked={oilQ === k}
                onChange={() => setOilQ(k)}
              />{" "}
              <span className="ml-2">{labelMap.oil[k]}</span>
            </label>
          ))}
        </div>

        {/* QUESTION 2 */}
        <div className="mb-8">
          <p className="mb-3 font-medium">How does your skin feel after washing?</p>
          {(["A", "B", "C", "D"] as const).map((k) => (
            <label key={`moisture-${k}`} className="block mb-2 text-slate-200">
              <input
                type="radio"
                name="moisture"
                value={k}
                checked={moistureQ === k}
                onChange={() => setMoistureQ(k)}
              />{" "}
              <span className="ml-2">{labelMap.moisture[k]}</span>
            </label>
          ))}
        </div>

        {/* QUESTION 3 */}
        <div className="mb-8">
          <p className="mb-3 font-medium">How easily does your skin get red or irritated?</p>
          {(["A", "B", "C", "D"] as const).map((k) => (
            <label key={`redness-${k}`} className="block mb-2 text-slate-200">
              <input
                type="radio"
                name="redness"
                value={k}
                checked={rednessQ === k}
                onChange={() => setRednessQ(k)}
              />{" "}
              <span className="ml-2">{labelMap.redness[k]}</span>
            </label>
          ))}
        </div>

        {/* QUESTION 4 */}
        <div className="mb-8">
          <p className="mb-3 font-medium">What’s your environment today?</p>
          {(["A", "B", "C"] as const).map((k) => (
            <label key={`env-${k}`} className="block mb-2 text-slate-200">
              <input
                type="radio"
                name="env"
                value={k}
                checked={envQ === k}
                onChange={() => setEnvQ(k)}
              />{" "}
              <span className="ml-2">{labelMap.env[k]}</span>
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
          Get my routine
        </button>

        {!canAnalyze && (
          <p className="mt-3 text-xs text-slate-400 text-center">
            Please answer all questions to continue.
          </p>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-10 p-6 bg-slate-900 border border-slate-700 rounded">
            <h2 className="text-2xl font-semibold">{result.skinType}</h2>

            {/* INPUT SUMMARY */}
            <div className="mt-4 p-4 rounded bg-slate-950 border border-slate-700 text-sm">
              <p className="text-slate-400 mb-2">Your inputs</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>Oil: {inputSummary.oil}</li>
                <li>After wash: {inputSummary.moisture}</li>
                <li>Redness: {inputSummary.redness}</li>
                <li>Environment: {inputSummary.env}</li>
              </ul>
            </div>

            {/* PRIMARY FOCUS */}
            <div className="mt-5 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Primary focus right now</p>
              <p className="text-lg font-semibold">{result.primaryFocus}</p>
            </div>

            {/* ENVIRONMENT */}
            <div className="mt-5 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Today’s environment stress</p>
              <p className="text-lg font-semibold">{result.climateBand}</p>
              <p className="text-sm text-slate-300 mt-2">{result.climateNote}</p>
            </div>

            {/* WHY THIS RESULT */}
            <div className="mt-5 text-sm text-slate-300">
              <p className="font-medium mb-1">Why this result?</p>
              <p>{whyMap[result.skinType] ?? whyMap["Balanced"]}</p>
            </div>

            {/* WHAT TO AVOID */}
            <div className="mt-5">
              <p className="font-semibold">What to avoid (next 2–3 weeks)</p>
              <ul className="list-disc pl-5 text-sm text-slate-300 mt-2 space-y-1">
                {(avoidMap[result.skinType] ?? avoidMap["Balanced"]).map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>

            {/* AM ROUTINE */}
            <div className="mt-6">
              <p className="font-semibold mb-2">AM Routine</p>
              <ol className="list-decimal pl-5 space-y-3">
                {result.amRoutine.map((step, idx) => (
                  <li key={`${step.title}-${idx}`}>
                    <p className="text-slate-100">{step.title}</p>
                    {step.why && <p className="text-xs text-slate-400 mt-1">{step.why}</p>}
                  </li>
                ))}
              </ol>
            </div>

            {/* PM ROUTINE */}
            <div className="mt-6">
              <p className="font-semibold mb-2">PM Routine</p>
              <ol className="list-decimal pl-5 space-y-3">
                {result.pmRoutine.map((step, idx) => (
                  <li key={`${step.title}-${idx}`}>
                    <p className="text-slate-100">{step.title}</p>
                    {step.why && <p className="text-xs text-slate-400 mt-1">{step.why}</p>}
                  </li>
                ))}
              </ol>
            </div>

            {/* NOTES */}
            {result.notes.length > 0 && (
              <div className="mt-6">
                <p className="font-semibold mb-2">Notes</p>
                <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                  {result.notes.map((n, idx) => (
                    <li key={`${n}-${idx}`}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CONTINUITY HOOK + EMAIL */}
            <div className="mt-8 p-5 rounded bg-slate-950 border border-slate-700">
              <p className="font-semibold">Get your next skin brief (Beta)</p>
              <p className="text-xs text-slate-400 mt-1">
                If you want a follow-up brief later, drop your email. (MVP: stored for testing only.)
              </p>

              <div className="mt-4">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded bg-black border border-slate-700 text-white outline-none"
                />
                <button
                  onClick={saveEmailForBeta}
                  className="mt-3 w-full py-3 rounded bg-white text-black font-medium"
                >
                  Save my email for Beta
                </button>

                {emailSavedMsg && (
                  <p className="mt-2 text-xs text-slate-400 text-center">{emailSavedMsg}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-500 text-center">
          MVP demo only. Not medical advice.
        </p>
      </div>
    </main>
  );
}