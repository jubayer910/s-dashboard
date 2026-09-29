import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/cn";

export type IconData = IconSvgElement;

/** Hugeicons at the Vantage stroke weight (1.25), coloured by currentColor. */
export function Icon({ icon, size = 16, className }: { icon: IconData; size?: number; className?: string }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={1.25}
      color="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}
