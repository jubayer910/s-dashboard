import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-[6px] border border-line bg-track px-[10px] text-[14px] leading-5 text-ink placeholder:text-muted outline-none transition-[border-color] duration-150 ease-out hover:border-line-strong focus-visible:border-lime/60 focus-visible:outline-none aria-[invalid=true]:border-negative-soft/70";

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; htmlFor: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={htmlFor} className="text-[12px] leading-4 text-kpi">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] leading-4 text-negative-soft">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] leading-4 text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, "h-9", className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "min-h-[120px] resize-y py-[8px]", className)} {...props} />;
}
