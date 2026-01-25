"use client";

import { useState, useEffect } from "react";

/* ---------- TYPES ---------- */
type Analysis = {
  skinType: string;
  primaryFocus: string;
  concerns: string[];
  amRoutine: string[];
  pmRoutine: string[];
  notes: string[];
  climateBand: "Low" | "Moderate" | "High";
  climateNote: string;
};

/* ---------- ANSWER → SCORE MAP ---------- */
const scoreMap: Record<string, number> = {
  A: 20,
  B: 40,
  C: 65,
  D: 85,
};

/* ---------- WHY + AVOID MAPS ---------- */
const whyMap: Record<string, string> = {
  "Oily + Dehydrated":
    "Your skin produces noticeable oil, but it also shows signs of dehydration. This often happens when the barrier is stressed (common with AC + Gulf climate), causing oil overproduction as compensation.",

  "Oily + Sensitive":
    "Your skin produces oil but also reacts easily. This usually indicates a stressed barrier rather than strong oily skin, so calming and consistency matter more than strong actives.",

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
    "Your oil levels look balanced, but your skin shows dehydration signs. In Gulf/AC environments this is common — hydration and barrier support help prevent sensitivity.",
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

/* ---------- LABEL MAP (FOR “YOUR INPUTS”) ---------- */
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

/* ---------- CORE ANALYSIS ---------- */
function analyzeSkin(oil: number, moisture: number, redness: number, env: string): Analysis {
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

  // Climate (skin-aware MVP)
  let climateBand: "Low" | "Moderate" | "High" = "Low";
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
      ? "In/out frequently: AC shock can trigger sensitivity. Avoid strong actives today."
      : "In/out frequently: AC shock risk. Keep routine simple and consistent.";
  } else if (env === "C") {
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

  // Routines
  const amRoutine = ["Gentle cleanser", "Hydrating serum", "Moisturizer", "Sunscreen SPF 50"];
  const pmRoutine = ["Gentle cleanser", "Barrier-repair moisturizer"];

  // Notes
  const notes: string[] = [];
  if (sensitive) notes.push("Keep routine simple. Avoid strong actives for now.");
  if (oily) notes.push("Avoid over-cleansing. Oil rebound risk.");
  if (dehydrated) notes.push("AC + Gulf climate increases dehydration risk.");

  return {
    skinType,
    primaryFocus,
    concerns,
    amRoutine,
    pmRoutine,
    notes,
    climateBand,
    climateNote,
  };
}

/* ---------- PAGE ---------- */
export default function ScanPage() {
  const [oilQ, setOilQ] = useState("");
  const [moistureQ, setMoistureQ] = useState("");
  const [rednessQ, setRednessQ] = useState("");
  const [envQ, setEnvQ] = useState("");

  const canAnalyze = Boolean(oilQ && moistureQ && rednessQ && envQ);

  const [result, setResult] = useState<Analysis | null>(null);

  /* Load saved scan on page load */
  useEffect(() => {
    const saved = localStorage.getItem("aerasense_last_scan");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.analysis) setResult(parsed.analysis);
    } catch {
      localStorage.removeItem("aerasense_last_scan");
    }
  }, []);

  function handleAnalyze() {
    if (!canAnalyze) return;

    const analysis = analyzeSkin(
      scoreMap[oilQ],
      scoreMap[moistureQ],
      scoreMap[rednessQ],
      envQ
    );

    setResult(analysis);

    localStorage.setItem(
      "aerasense_last_scan",
      JSON.stringify({
        analysis,
        inputs: { oilQ, moistureQ, rednessQ, envQ },
        timestamp: Date.now(),
      })
    );
  }

  function clearSavedScan() {
    localStorage.removeItem("aerasense_last_scan");
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-black text-white flex justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold mb-8 text-center">
          AeraSense Skin Scan (MVP)
        </h1>

        {/* LAST SCAN BANNER */}
        {result && (
          <div className="mb-4 p-4 rounded bg-slate-950 border border-slate-700 text-sm text-slate-300">
            <p className="text-slate-400">Last scan</p>
            <p>
              {result.skinType} · Climate risk: {result.climateBand}
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
        <div className="mb-6">
          <p className="mb-2">How oily does your skin feel by midday?</p>
          {(["A", "B", "C", "D"] as const).map((k) => (
            <label key={k} className="block mb-1">
              <input type="radio" name="oil" value={k} onChange={() => setOilQ(k)} />{" "}
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
                onChange={() => setRednessQ(k)}
              />{" "}
              {labelMap.redness[k]}
            </label>
          ))}
        </div>

        {/* QUESTION 4 */}
        <div className="mb-6">
          <p className="mb-2">What’s your environment today?</p>

          {(["A", "B", "C"] as const).map((k) => (
            <label key={k} className="block mb-1">
              <input type="radio" name="env" value={k} onChange={() => setEnvQ(k)} />{" "}
              {labelMap.env[k]}
            </label>
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className={`w-full py-3 rounded font-medium ${
            canAnalyze
              ? "bg-white text-black"
              : "bg-slate-700 text-slate-300 cursor-not-allowed"
          }`}
        >
          Analyze Skin
        </button>

        {!canAnalyze && (
          <p className="mt-3 text-xs text-slate-400 text-center">
            Please answer all questions to continue.
          </p>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-8 p-5 bg-slate-900 border border-slate-700 rounded">
            <h2 className="text-xl font-semibold">{result.skinType}</h2>

            {/* INPUT SUMMARY */}
            <div className="mt-3 p-4 rounded bg-slate-950 border border-slate-700 text-sm">
              <p className="text-slate-400 mb-2">Your inputs</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>Oil: {oilQ ? labelMap.oil[oilQ as "A" | "B" | "C" | "D"] : "-"}</li>
                <li>
                  After wash:{" "}
                  {moistureQ ? labelMap.moisture[moistureQ as "A" | "B" | "C" | "D"] : "-"}
                </li>
                <li>
                  Redness: {rednessQ ? labelMap.redness[rednessQ as "A" | "B" | "C" | "D"] : "-"}
                </li>
                <li>Environment: {envQ ? labelMap.env[envQ as "A" | "B" | "C"] : "-"}</li>
              </ul>
            </div>

            {/* PRIMARY FOCUS */}
            <div className="mt-4 mb-4 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Primary focus right now</p>
              <p className="text-lg font-semibold">{result.primaryFocus}</p>
            </div>

            {/* CLIMATE */}
            <div className="mt-4 mb-4 p-4 rounded bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-400">Gulf Climate Risk Today</p>
              <p className="text-lg font-semibold">{result.climateBand}</p>
              <p className="text-sm text-slate-300 mt-2">{result.climateNote}</p>
            </div>

            {/* WHY THIS RESULT */}
            <div className="mt-4 text-sm text-slate-300">
              <p className="font-medium mb-1">Why this result?</p>
              <p>{whyMap[result.skinType] ?? whyMap["Balanced"]}</p>
            </div>

            {/* WHAT NOT TO DO */}
            <div className="mt-4">
              <strong>What to avoid for now</strong>
              <ul className="list-disc pl-5 text-sm text-slate-400 mt-2">
                {(avoidMap[result.skinType] ?? avoidMap["Balanced"]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {/* CONCERNS */}
            <ul className="mt-3 list-disc pl-5">
              {result.concerns.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>

            {/* AM ROUTINE */}
            <div className="mt-4">
              <strong>AM Routine</strong>
              <ol className="list-decimal pl-5">
                {result.amRoutine.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>

            {/* PM ROUTINE */}
            <div className="mt-4">
              <strong>PM Routine</strong>
              <ol className="list-decimal pl-5">
                {result.pmRoutine.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>

            {/* NOTES */}
            <ul className="mt-4 list-disc pl-5 text-sm text-slate-300">
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500 text-center">
          MVP demo only. Not medical advice.
        </p>
      </div>
    </main>
  );
}