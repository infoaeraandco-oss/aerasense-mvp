"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------------- TYPES ---------------- */

type OilKey = "A" | "B" | "C" | "D";
type MoistureKey = "A" | "B" | "C" | "D";
type RednessKey = "A" | "B" | "C" | "D";
type EnvKey = "A" | "B" | "C";

type ClimateBand = "Low" | "Moderate" | "High";

type RoutineStep = {
  id: string; // stable key
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
  climateBand: ClimateBand;
  climateNote: string;

  whyThisResult: string;
  avoid: string[];

  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];

  notes: string[];
};

type SavedInputs = {
  oilQ: OilKey;
  moistureQ: MoistureKey;
  rednessQ: RednessKey;
  envQ: EnvKey;
};

/* ---------------- CONSTANTS ---------------- */

const scoreMap: Record<OilKey | MoistureKey | RednessKey, number> = {
  A: 20,
  B: 40,
  C: 65,
  D: 85,
};

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

const whyMap: Record<Analysis["skinType"], string> = {
  "Oily + Dehydrated":
    "You’re getting visible oil, but also dehydration signals. This commonly happens when the barrier is stressed (AC + heat shifts), which can trigger oil overproduction as compensation.",
  "Oily + Sensitive":
    "You have oil signals plus reactivity. This usually points to a stressed barrier — not ‘strong oily skin’. Calm + consistency beats strong actives right now.",
  "Dry + Sensitive":
    "Dryness plus reactivity often signals a weakened barrier. Gentle hydration + barrier repair should come before any strong actives.",
  Oily:
    "Oil signals are stronger than average, increasing congestion risk. The goal is oil balance without stripping.",
  Dry:
    "Your skin lacks moisture and likely has a weaker barrier. Hydration + barrier support helps reduce tightness and irritation risk.",
  Sensitive:
    "Your skin reacts easily. Calming + minimizing triggers helps restore stability.",
  Balanced:
    "Your skin looks fairly balanced. The focus is maintenance: gentle cleansing, hydration, and consistent SPF.",
  "Balanced + Dehydrated":
    "Oil looks balanced, but dehydration signals are present — common in Gulf/AC environments. Hydration + barrier support helps prevent sensitivity.",
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
    "Fragrance-heavy products",
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

/* ---------------- CORE ANALYSIS ---------------- */

function buildRoutines(params: {
  skinType: Analysis["skinType"];
  oily: boolean;
  dehydrated: boolean;
  dry: boolean;
  sensitive: boolean;
  env: EnvKey;
}): { am: RoutineStep[]; pm: RoutineStep[]; notes: string[] } {
  const { skinType, oily, dehydrated, dry, sensitive, env } = params;

  const notes: string[] = [];

  // Base always-safe skeleton
  const am: RoutineStep[] = [
    { id: "am-cleanser", title: "Gentle cleanser" },
    { id: "am-moisturizer", title: "Moisturizer" },
    { id: "am-spf", title: "Sunscreen SPF 50" },
  ];

  const pm: RoutineStep[] = [
    { id: "pm-cleanser", title: "Gentle cleanser" },
    { id: "pm-moisturizer", title: "Moisturizer" },
  ];

  // Add hydration layer if dehydrated/dry or AC heavy
  if (dehydrated || dry || env === "A" || env === "B") {
    am.splice(1, 0, {
      id: "am-hydration",
      title: "Hydrating serum",
      why: "Supports dehydration signals and reduces sensitivity/oil rebound risk in AC environments.",
    });
    notes.push("Hydration is prioritized because AC + environment shifts can dehydrate the barrier.");
  }

  // Make moisturizer text feel personalized
  if (oily) {
    // oily: lighter texture guidance
    am.find((s) => s.id === "am-moisturizer")!.title = "Moisturizer (light gel)";
    am.find((s) => s.id === "am-moisturizer")!.why =
      "Supports the barrier without feeling heavy — reduces over-reactivity and oil rebound.";
    pm.find((s) => s.id === "pm-moisturizer")!.title = "Moisturizer (barrier-support)";
    pm.find((s) => s.id === "pm-moisturizer")!.why =
      "Barrier support helps reduce congestion triggers caused by over-stripping.";
    notes.push("Avoid over-cleansing — it can increase oil rebound.");
  } else if (dry || dehydrated) {
    am.find((s) => s.id === "am-moisturizer")!.title = "Moisturizer (barrier-rich)";
    am.find((s) => s.id === "am-moisturizer")!.why =
      "Restores comfort and helps reduce tightness by supporting barrier function.";
    pm.find((s) => s.id === "pm-moisturizer")!.title = "Barrier-repair moisturizer";
    pm.find((s) => s.id === "pm-moisturizer")!.why =
      "Night routine focuses on recovery mode: repair before any strong actives.";
    notes.push("Barrier-first approach recommended due to dryness/dehydration signals.");
  } else {
    // balanced
    am.find((s) => s.id === "am-moisturizer")!.why = "Maintains balance and resilience against daily environment swings.";
    pm.find((s) => s.id === "pm-moisturizer")!.why = "Keeps the barrier stable and reduces future sensitivity risk.";
  }

  // Sensitive: simplify + “no actives” message
  if (sensitive) {
    notes.push("Keep routine simple. Avoid strong actives until redness settles.");

    // Add calming step
    am.splice(2, 0, {
      id: "am-calming",
      title: "Calming step (soothing serum/cream)",
      why: "Helps reduce reactivity and supports barrier stability.",
    });

    // PM: recovery emphasis
    pm.find((s) => s.id === "pm-moisturizer")!.title = "Barrier-repair moisturizer";
    pm.find((s) => s.id === "pm-moisturizer")!.why =
      "Tonight is recovery mode: barrier support before any strong actives.";
  }

  // Environment-specific SPF why
  const spf = am.find((s) => s.id === "am-spf")!;
  if (env === "C") {
    spf.why = "Outdoor exposure increases UV/heat stress — protect daily to reduce irritation and pigmentation risk.";
  } else if (env === "B") {
    spf.why = "In/out shifts can trigger reactivity; SPF supports stability and protection.";
  } else {
    spf.why = "Consistent daily SPF supports prevention and reduces future sensitivity/pigmentation risk.";
  }

  // Make it feel different by skinType label nuance
  if (skinType === "Oily + Dehydrated") {
    notes.push("Oil + dehydration together often means barrier stress, not ‘dirty skin’ — be gentle.");
  }
  if (skinType === "Dry + Sensitive") {
    notes.push("Avoid experimenting with many products at once — stability first.");
  }

  return { am, pm, notes };
}

function analyzeSkin(oil: number, moisture: number, redness: number, env: EnvKey): Analysis {
  const oily = oil >= 65;
  const dehydrated = moisture <= 45;
  const dry = moisture <= 35;
  const sensitive = redness >= 60;

  // Skin type classification
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

  // Environment stress (MVP = based on user-selected environment, not live weather)
  let climateBand: ClimateBand = "Low";
  let climateNote = "Environment looks stable. Keep routine consistent.";

  const barrierRisk = sensitive || dehydrated || dry;

  if (env === "A") {
    climateBand = "Moderate";
    climateNote = barrierRisk
      ? "Mostly indoors (AC): can dry and irritate the barrier. Keep routine gentle and hydrating."
      : "Mostly indoors (AC): hydration support helps maintain balance.";
  } else if (env === "B") {
    climateBand = "High";
    climateNote = barrierRisk
      ? "In/out frequently: ‘AC shock’ can trigger sensitivity. Avoid strong actives today."
      : "In/out frequently: environment swings can stress skin. Keep routine simple and consistent.";
  } else {
    climateBand = "High";
    climateNote = barrierRisk
      ? "Mostly outdoors: UV/heat can worsen irritation. SPF is non-negotiable."
      : "Mostly outdoors: UV/heat stress. SPF is essential; avoid overdoing actives.";
  }

  // Concerns
  const concerns: string[] = [];
  if (oily) concerns.push("Oil control / congestion risk");
  if (dry || dehydrated) concerns.push("Dehydration / barrier support");
  if (sensitive) concerns.push("Redness / sensitivity");
  if (concerns.length === 0) concerns.push("Maintenance / prevention");

  // Routines (dynamic per result)
  const routinePack = buildRoutines({ skinType, oily, dehydrated, dry, sensitive, env });

  return {
    skinType,
    primaryFocus,
    concerns,
    climateBand,
    climateNote,
    whyThisResult: whyMap[skinType],
    avoid: avoidMap[skinType],
    amRoutine: routinePack.am,
    pmRoutine: routinePack.pm,
    notes: routinePack.notes,
  };
}

/* ---------------- PAGE ---------------- */

export default function ScanPage() {
  const [oilQ, setOilQ] = useState<OilKey | "">("");
  const [moistureQ, setMoistureQ] = useState<MoistureKey | "">("");
  const [rednessQ, setRednessQ] = useState<RednessKey | "">("");
  const [envQ, setEnvQ] = useState<EnvKey | "">("");

  const canAnalyze = Boolean(oilQ && moistureQ && rednessQ && envQ);

  const [result, setResult] = useState<Analysis | null>(null);
  const [savedInputs, setSavedInputs] = useState<SavedInputs | null>(null);

  const [email, setEmail] = useState("");
  const [emailSavedMsg, setEmailSavedMsg] = useState<string | null>(null);

  const savedSummary = useMemo(() => {
    if (!result) return null;
    return `${result.skinType} · Environment stress: ${result.climateBand}`;
  }, [result]);

  // Load saved scan
  useEffect(() => {
    const saved = localStorage.getItem("aerasense_last_scan");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { analysis?: Analysis; inputs?: SavedInputs };
      if (parsed?.analysis) setResult(parsed.analysis);
      if (parsed?.inputs) setSavedInputs(parsed.inputs);
    } catch {
      localStorage.removeItem("aerasense_last_scan");
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

    const inputs: SavedInputs = {
      oilQ: oilQ as OilKey,
      moistureQ: moistureQ as MoistureKey,
      rednessQ: rednessQ as RednessKey,
      envQ: envQ as EnvKey,
    };

    setResult(analysis);
    setSavedInputs(inputs);
    setEmailSavedMsg(null);

    localStorage.setItem(
      "aerasense_last_scan",
      JSON.stringify({
        analysis,
        inputs,
        timestamp: Date.now(),
      })
    );
  }

  function clearSavedScan() {
    localStorage.removeItem("aerasense_last_scan");
    setResult(null);
    setSavedInputs(null);
    setEmailSavedMsg(null);
    setEmail("");
  }

  function saveEmail() {
    if (!email.trim()) {
      setEmailSavedMsg("Please enter your email.");
      return;
    }

    const clean = email.trim().toLowerCase();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);

    if (!ok) {
      setEmailSavedMsg("That doesn’t look like a valid email.");
      return;
    }

    // MVP storage (local)
    const key = "aerasense_beta_emails";
    const existingRaw = localStorage.getItem(key);
    const existing: Array<{ email: string; ts: number; context?: any }> = existingRaw ? JSON.parse(existingRaw) : [];

    existing.push({
      email: clean,
      ts: Date.now(),
      context: result
        ? {
            skinType: result.skinType,
            climateBand: result.climateBand,
          }
        : null,
    });

    localStorage.setItem(key, JSON.stringify(existing));
    setEmailSavedMsg("Saved. We’ll send your next brief to this email (beta).");
    setEmail("");
  }

  return (
    <main className="min-h-screen bg-black text-white flex justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold text-center">AeraSense Skin Scan (MVP)</h1>
        <p className="mt-2 text-sm text-slate-400 text-center">
          Answer 4 quick questions — we model oil balance, barrier stress, and today’s environment risk.
        </p>

        {/* LAST SCAN BANNER */}
        {result && (
          <div className="mt-6 mb-6 p-4 rounded bg-slate-950 border border-slate-700 text-sm text-slate-300">
            <p className="text-slate-400">Last scan saved</p>
            <p className="mt-1">{savedSummary}</p>
            <button onClick={clearSavedScan} className="mt-2 text-xs text-slate-400 underline">
              Clear saved scan
            </button>
          </div>
        )}

        {/* QUESTIONS */}
        <div className="mt-8">
          {/* Q1 */}
          <div className="mb-7">
            <p className="mb-2">How oily does your skin feel by midday?</p>
            {(["A", "B", "C", "D"] as const).map((k) => (
              <label key={`oil-${k}`} className="block mb-1 text-slate-200">
                <input type="radio" name="oil" value={k} onChange={() => setOilQ(k)} />{" "}
                <span className="text-slate-200">{labelMap.oil[k]}</span>
              </label>
            ))}
          </div>

          {/* Q2 */}
          <div className="mb-7">
            <p className="mb-2">How does your skin feel after washing?</p>
            {(["A", "B", "C", "D"] as const).map((k) => (
              <label key={`moisture-${k}`} className="block mb-1 text-slate-200">
                <input type="radio" name="moisture" value={k} onChange={() => setMoistureQ(k)} />{" "}
                <span className="text-slate-200">{labelMap.moisture[k]}</span>
              </label>
            ))}
          </div>

          {/* Q3 */}
          <div className="mb-7">
            <p className="mb-2">How easily does your skin get red or irritated?</p>
            {(["A", "B", "C", "D"] as const).map((k) => (
              <label key={`redness-${k}`} className="block mb-1 text-slate-200">
                <input type="radio" name="redness" value={k} onChange={() => setRednessQ(k)} />{" "}
                <span className="text-slate-200">{labelMap.redness[k]}</span>
              </label>
            ))}
          </div>

          {/* Q4 */}
          <div className="mb-7">
            <p className="mb-2">What’s your environment today?</p>
            {(["A", "B", "C"] as const).map((k) => (
              <label key={`env-${k}`} className="block mb-1 text-slate-200">
                <input type="radio" name="env" value={k} onChange={() => setEnvQ(k)} />{" "}
                <span className="text-slate-200">{labelMap.env[k]}</span>
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
            <p className="mt-3 text-xs text-slate-400 text-center">Please answer all questions to continue.</p>
          )}
        </div>

        {/* RESULT */}
        {result && (
          <div className="mt-8 p-5 bg-slate-900 border border-slate-700 rounded">
            <h2 className="text-xl font-semibold">{result.skinType}</h2>

            {/* INPUT SUMMARY */}
            <div className="mt-4 p-4 rounded bg-slate-950 border border-slate-700 text-sm">
              <p className="text-slate-400 mb-2">Your inputs</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>Oil: {savedInputs ? labelMap.oil[savedInputs.oilQ] : "-"}</li>
                <li>After wash: {savedInputs ? labelMap.moisture[savedInputs.moistureQ] : "-"}</li>
                <li>Redness: {savedInputs ? labelMap.redness[savedInputs.rednessQ] : "-"}</li>
                <li>Environment: {savedInputs ? labelMap.env[savedInputs.envQ] : "-"}</li>
              </ul>
            </div>

            {/* PRIMARY FOCUS */}
            <div className="mt-4 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Primary focus right now</p>
              <p className="text-lg font-semibold">{result.primaryFocus}</p>
            </div>

            {/* ENVIRONMENT STRESS (MVP wording) */}
            <div className="mt-4 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Today’s environment stress</p>
              <p className="text-lg font-semibold">{result.climateBand}</p>
              <p className="text-sm text-slate-300 mt-2">{result.climateNote}</p>
            </div>

            {/* WHY */}
            <div className="mt-4 text-sm text-slate-300">
              <p className="font-medium mb-1">Why this result?</p>
              <p>{result.whyThisResult}</p>
            </div>

            {/* AVOID */}
            <div className="mt-5">
              <p className="font-semibold">What to avoid for now</p>
              <ul className="list-disc pl-5 text-sm text-slate-400 mt-2 space-y-1">
                {result.avoid.map((item, idx) => (
                  <li key={`avoid-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>

            {/* CONCERNS */}
            <div className="mt-5">
              <p className="font-semibold">Key concerns</p>
              <ul className="list-disc pl-5 text-sm text-slate-300 mt-2 space-y-1">
                {result.concerns.map((c, idx) => (
                  <li key={`concern-${idx}`}>{c}</li>
                ))}
              </ul>
            </div>

            {/* AM ROUTINE */}
            <div className="mt-6">
              <p className="font-semibold">AM Routine</p>
              <ol className="mt-2 list-decimal pl-5 space-y-3">
                {result.amRoutine.map((step) => (
                  <li key={step.id}>
                    <p className="text-slate-100">{step.title}</p>
                    {step.why && <p className="text-xs text-slate-400 mt-1">{step.why}</p>}
                  </li>
                ))}
              </ol>
            </div>

            {/* PM ROUTINE */}
            <div className="mt-6">
              <p className="font-semibold">PM Routine</p>
              <ol className="mt-2 list-decimal pl-5 space-y-3">
                {result.pmRoutine.map((step) => (
                  <li key={step.id}>
                    <p className="text-slate-100">{step.title}</p>
                    {step.why && <p className="text-xs text-slate-400 mt-1">{step.why}</p>}
                  </li>
                ))}
              </ol>
            </div>

            {/* NOTES */}
            {result.notes.length > 0 && (
              <div className="mt-6">
                <p className="font-semibold">Notes</p>
                <ul className="list-disc pl-5 text-sm text-slate-300 mt-2 space-y-1">
                  {result.notes.map((n, idx) => (
                    <li key={`note-${idx}`}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* EMAIL CAPTURE */}
            <div className="mt-7 p-4 rounded bg-slate-950 border border-slate-700">
              <p className="font-semibold">Get your next skin brief (Beta)</p>
              <p className="text-xs text-slate-400 mt-1">
                If you want a follow-up brief later, drop your email. (MVP: stored for testing only.)
              </p>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-3 w-full px-3 py-2 rounded bg-black border border-slate-700 text-white outline-none"
              />

              <button onClick={saveEmail} className="mt-3 w-full py-3 rounded bg-white text-black font-medium">
                Save my email for Beta
              </button>

              {emailSavedMsg && <p className="mt-2 text-xs text-slate-400 text-center">{emailSavedMsg}</p>}
            </div>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-500 text-center">MVP demo only. Not medical advice.</p>
      </div>
    </main>
  );
}