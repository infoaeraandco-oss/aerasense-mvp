"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center px-6">
        <h1 className="text-4xl font-semibold mb-3">AeraSense</h1>
        <p className="text-gray-400">
          Climate-aware skin intelligence for the Gulf.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/scan"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded bg-white text-black font-medium"
          >
            Start Skin Scan
          </Link>

          <p className="text-xs text-slate-500">
            MVP demo only. Not medical advice.
          </p>
        </div>
      </div>
    </main>
  );
}