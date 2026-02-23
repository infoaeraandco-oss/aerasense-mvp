import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-semibold mb-3">AeraSense</h1>

        <p className="text-sm text-slate-400 mb-6">
          Climate-aware skin intelligence for the Gulf.
        </p>

        <p className="text-sm text-slate-300 mb-6">
          Get a safe, personalized routine based on your skin signals and today’s
          environment — in under 60 seconds.
        </p>

        <Link
          href="/scan"
          className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-md bg-white text-black font-medium hover:bg-slate-200 transition"
        >
          Start Skin Scan
        </Link>

        <p className="mt-4 text-xs text-slate-500">
          MVP demo only. Not medical advice.
        </p>
      </div>
    </main>
  );
}