"use client";

import { secondaryButtonClass } from "@/components/ui/primitives";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const missingDb = /DATABASE_URL|no metrics/i.test(error.message);
  return (
    <main className="grid min-h-dvh place-items-center bg-page px-6">
      <div className="flex max-w-[440px] flex-col items-center gap-3 text-center">
        <p className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">
          {missingDb ? "The database isn’t ready yet" : "Something went wrong loading Vantage"}
        </p>
        <p className="text-[14px] leading-5 text-muted">
          {missingDb
            ? "Connect the Neon database to this project and seed it, then reload."
            : "The dashboard couldn’t load its data. Try again in a moment."}
        </p>
        <button type="button" onClick={reset} className={`${secondaryButtonClass} mt-2`}>
          Try again
        </button>
      </div>
    </main>
  );
}
