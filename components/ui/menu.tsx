"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useState, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconData } from "./icon";

type Align = "start" | "center" | "end";

/**
 * Menu surface from the Figma set: #1A1A1A, 1px #2e2e2e, radius 10 (item 6 + padding 4).
 * Opens in 180ms from the trigger; opened or closed from the keyboard it doesn't animate.
 */
export function Menu({
  trigger,
  triggerClassName,
  triggerLabel,
  children,
  align = "start",
  sideOffset = 6,
  width,
  open: controlledOpen,
  onOpenChange,
  triggerRef,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  children: ReactNode;
  align?: Align;
  sideOffset?: number;
  width?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  return (
    <BaseMenu.Root
      open={open}
      onOpenChange={(next, details) => {
        setKeyboard(details.event instanceof KeyboardEvent);
        setUncontrolledOpen(next);
        onOpenChange?.(next);
      }}
    >
      <BaseMenu.Trigger ref={triggerRef} className={triggerClassName} aria-label={triggerLabel}>
        {trigger}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner align={align} sideOffset={sideOffset} collisionPadding={12} className="z-50 outline-none">
          <BaseMenu.Popup
            data-kbd={keyboard || undefined}
            style={width ? { width } : undefined}
            className="overlay-surface pop-menu rounded-[10px] p-1 outline-none"
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

/** Right-click menu that shares the Menu surface and items; opens at the pointer. */
export function ContextMenu({ children, content, className }: { children: ReactNode; content: ReactNode; className?: string }) {
  return (
    <BaseContextMenu.Root>
      <BaseContextMenu.Trigger className={className}>{children}</BaseContextMenu.Trigger>
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner className="z-50 outline-none" collisionPadding={12}>
          <BaseContextMenu.Popup className="overlay-surface pop-menu w-[232px] rounded-[10px] p-1 outline-none">
            {content}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}

const itemClass =
  "group/item relative flex h-[30px] w-full cursor-default items-center justify-between gap-3 rounded-[6px] border border-transparent px-[6px] text-[14px] tracking-[-0.28px] text-nav outline-none select-none data-[highlighted]:nav-surface data-[disabled]:opacity-40";

function ItemBody({ icon, label, meta, destructive }: { icon?: IconData; label: ReactNode; meta?: ReactNode; destructive?: boolean }) {
  return (
    <>
      <span className={cn("flex min-w-0 items-center gap-[6px]", destructive && "text-negative-soft")}>
        {icon ? <Icon icon={icon} size={15} /> : null}
        <span className="truncate">{label}</span>
      </span>
      {meta ? <span className="shrink-0 font-mono text-[11px] leading-[15px] text-muted">{meta}</span> : null}
    </>
  );
}

/* Menu item (State=Default / Hover) */
export function MenuItem({
  icon,
  label,
  meta,
  destructive,
  disabled,
  onClick,
  closeOnClick = true,
}: {
  icon?: IconData;
  label: ReactNode;
  meta?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  closeOnClick?: boolean;
}) {
  return (
    <BaseMenu.Item className={itemClass} disabled={disabled} onClick={onClick} closeOnClick={closeOnClick}>
      <ItemBody icon={icon} label={label} meta={meta} destructive={destructive} />
    </BaseMenu.Item>
  );
}

function CheckIndicator({ children }: { children: ReactNode }) {
  return <span className="grid size-[15px] shrink-0 place-items-center">{children}</span>;
}

/* Menu item (State=Selected) as a radio group */
export function MenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <BaseMenu.RadioGroup value={value} onValueChange={(next) => onValueChange(String(next))}>
      {children}
    </BaseMenu.RadioGroup>
  );
}

export function MenuRadioItem({ value, label, meta, closeOnClick = true }: { value: string; label: ReactNode; meta?: ReactNode; closeOnClick?: boolean }) {
  return (
    <BaseMenu.RadioItem value={value} closeOnClick={closeOnClick} className={cn(itemClass, "data-[checked]:text-ink")}>
      <span className="flex min-w-0 items-center gap-[6px]">
        <span className="truncate">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {meta ? <span className="font-mono text-[11px] leading-[15px] text-muted">{meta}</span> : null}
        <CheckIndicator>
          <BaseMenu.RadioItemIndicator className="icon-swap text-brand">
            <Icon icon={Tick02Icon} size={15} />
          </BaseMenu.RadioItemIndicator>
        </CheckIndicator>
      </span>
    </BaseMenu.RadioItem>
  );
}

export function MenuCheckboxItem({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
}) {
  return (
    <BaseMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      closeOnClick={false}
      className={cn(itemClass, "data-[checked]:text-ink")}
    >
      <span className="truncate">{label}</span>
      <CheckIndicator>
        <BaseMenu.CheckboxItemIndicator className="icon-swap text-brand">
          <Icon icon={Tick02Icon} size={15} />
        </BaseMenu.CheckboxItemIndicator>
      </CheckIndicator>
    </BaseMenu.CheckboxItem>
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="divider-h my-1" />;
}

export function MenuGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <BaseMenu.Group>
      <BaseMenu.GroupLabel className="px-[10px] pt-[6px] pb-[4px] text-[12px] leading-normal tracking-[0.48px] text-section uppercase select-none">
        {label}
      </BaseMenu.GroupLabel>
      {children}
    </BaseMenu.Group>
  );
}
