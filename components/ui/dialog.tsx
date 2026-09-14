"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./primitives";

/**
 * Modal from the Figma set: centred, 64% black scrim, overlay surface.
 * Enter 240ms scale 0.96 → 1 from the centre; exit 150ms.
 */
export function Dialog({
  open,
  onOpenChange,
  children,
  width = 480,
  className,
  finalFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  width?: number;
  className?: string;
  finalFocus?: RefObject<HTMLElement | null>;
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/64" />
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <BaseDialog.Popup
            finalFocus={finalFocus}
            style={{ width: `min(${width}px, 100%)` }}
            className={cn(
              "overlay-surface dialog-popup pointer-events-auto relative max-h-[calc(100dvh-32px)] overflow-y-auto rounded-[10px] outline-none",
              className,
            )}
          >
            {children}
          </BaseDialog.Popup>
        </div>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;

export function DialogClose() {
  return (
    <BaseDialog.Close render={<IconButton icon={Cancel01Icon} label="Close" iconSize={16} />} />
  );
}
