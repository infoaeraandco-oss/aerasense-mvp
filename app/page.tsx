import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-semibold mb-3">AeraInsight</h1>

        <p className="text-sm text-slate-400 mb-6">
          Context-aware skin intelligence.
        </p>

        <p className="text-sm text-slate-300 mb-6">
  Know your skin. Understand current risk patterns.
  <br />
  Focus on what matters — in under 60 seconds.
</p>

        <Link
          href="/scan"
          className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-md bg-white text-black font-medium hover:bg-slate-200 transition"
        >
          Start my skin scan
        </Link>

        <p className="mt-4 text-xs text-slate-500">
          MVP demo only. Not medical advice.
        </p>
      </div>
    </main>
  );
}