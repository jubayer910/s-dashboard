import type { ComponentProps, ReactNode } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/cn";
import type { Tier } from "@/lib/types";
import { Icon, type IconData } from "./icon";

/* Divider / Horizontal · Divider / Vertical */
export function Divider({ orientation = "horizontal", className }: { orientation?: "horizontal" | "vertical"; className?: string }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(orientation === "horizontal" ? "divider-h w-full" : "divider-v self-stretch", className)}
    />
  );
}

/* Section label */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-[10px] py-[6px] text-[12px] leading-normal tracking-[0.48px] text-section uppercase select-none", className)}>
      {children}
    </div>
  );
}

/* Badge / Tier */
const TIER_COLOR: Record<Tier, string> = {
  EMERALD: "border-tier-emerald-line bg-tier-emerald-bg text-tier-emerald",
  EAGLE: "border-tier-eagle-line bg-tier-eagle-bg text-tier-eagle",
  PLATINUM: "border-tier-platinum-line bg-tier-platinum-bg text-tier-platinum",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center rounded-[6px] border px-[6px] text-[10px] leading-none font-medium tracking-[-0.06px] drop-shadow-[0_0_2.3px_rgb(0_0_0/0.5)]",
        TIER_COLOR[tier],
      )}
    >
      {tier}
    </span>
  );
}

/* Title block */
export function TitleBlock({
  title,
  subtitle,
  as: Heading = "h2",
  className,
  id,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Heading id={id} className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">
        {title}
      </Heading>
      {subtitle ? <p className="text-[14px] leading-[18px] text-muted">{subtitle}</p> : null}
    </div>
  );
}

/* Button / Secondary */
export const secondaryButtonClass =
  "control pressable group inline-flex h-8 shrink-0 items-center gap-1 px-[10px] text-[14px] leading-5 whitespace-nowrap text-label select-none hover:border-line-strong data-[popup-open]:border-line-strong disabled:pointer-events-none disabled:opacity-40";

export function ButtonContent({
  icon,
  children,
  chevron,
  iconClassName,
}: {
  icon?: IconData;
  children: ReactNode;
  chevron?: boolean;
  iconClassName?: string;
}) {
  return (
    <>
      {icon ? <Icon icon={icon} size={16} className={cn("text-label", iconClassName)} /> : null}
      <span>{children}</span>
      {chevron ? (
        <Icon
          icon={ArrowDown01Icon}
          size={16}
          className="text-chevron transition-transform duration-150 ease-out group-data-[popup-open]:rotate-180"
        />
      ) : null}
    </>
  );
}

export function Button({
  icon,
  chevron,
  children,
  className,
  iconClassName,
  type = "button",
  ...props
}: ComponentProps<"button"> & { icon?: IconData; chevron?: boolean; iconClassName?: string }) {
  return (
    <button type={type} className={cn(secondaryButtonClass, icon ? "pl-[8px]" : undefined, className)} {...props}>
      <ButtonContent icon={icon} chevron={chevron} iconClassName={iconClassName}>
        {children}
      </ButtonContent>
    </button>
  );
}

/* Button / Icon */
export const iconButtonClass =
  "control pressable grid size-8 shrink-0 place-items-center text-label hover:border-line-strong data-[popup-open]:border-line-strong disabled:pointer-events-none disabled:opacity-40";

export function IconButton({
  icon,
  label,
  className,
  iconSize = 18,
  type = "button",
  ...props
}: ComponentProps<"button"> & { icon: IconData; label: string; iconSize?: number }) {
  return (
    <button type={type} aria-label={label} className={cn(iconButtonClass, className)} {...props}>
      <Icon icon={icon} size={iconSize} />
    </button>
  );
}

/* Delta pill (from the KPI cell) */
export function DeltaPill({ tone, children, className }: { tone: "positive" | "negative" | "neutral"; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "tnum inline-flex items-center justify-center rounded-[22px] p-[2px] text-[12px] leading-[1.1] whitespace-nowrap",
        tone === "positive" && "bg-positive/10 text-positive",
        tone === "negative" && "bg-negative/10 text-negative",
        tone === "neutral" && "bg-white/5 text-muted-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] leading-[15px] text-muted">{children}</span>;
}
