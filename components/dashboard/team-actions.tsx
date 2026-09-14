"use client";

import { Download04Icon, Mail01Icon, Pin02Icon, PinOffIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { useTransition } from "react";
import { toast } from "sonner";
import { setLegPinned } from "@/app/actions";
import { useShell } from "@/components/shell/shell-provider";
import { MenuItem, MenuSeparator } from "@/components/ui/menu";
import { useDashboard } from "./dashboard-provider";

export function exportUrl(legId: number, query: string) {
  const params = new URLSearchParams(query.replace(/^\?/, ""));
  params.set("leg", String(legId));
  return `/api/export?${params.toString()}`;
}

export function downloadCsv(legId: number, query: string) {
  const link = document.createElement("a");
  link.href = exportUrl(legId, query);
  link.download = "";
  document.body.append(link);
  link.click();
  link.remove();
}

export function usePinToggle() {
  const [pending, startTransition] = useTransition();
  const toggle = (leg: { id: number; name: string; pinned: boolean }) =>
    startTransition(async () => {
      const result = await setLegPinned(leg.id, !leg.pinned);
      if (!result.ok) toast.error(result.error);
      else toast.success(leg.pinned ? `${leg.name} unpinned from the leaderboard` : `${leg.name} pinned to the leaderboard`);
    });
  return { pending, toggle };
}

/** Shared by the ⋯ menu and the right-click menu. */
export function TeamActionItems({ leg }: { leg: { id: number; name: string; pinned: boolean } }) {
  const { openTeam, query } = useDashboard();
  const { openDialog } = useShell();
  const { toggle } = usePinToggle();
  return (
    <>
      <MenuItem icon={UserGroupIcon} label="View team" onClick={() => openTeam(leg.id)} />
      <MenuItem icon={Mail01Icon} label="Message leaders" onClick={() => openDialog({ kind: "message", legId: leg.id, legName: leg.name })} />
      <MenuItem icon={Download04Icon} label="Export row as CSV" onClick={() => downloadCsv(leg.id, query)} />
      <MenuSeparator />
      <MenuItem
        icon={leg.pinned ? PinOffIcon : Pin02Icon}
        label={leg.pinned ? "Unpin from leaderboard" : "Pin to leaderboard"}
        onClick={() => toggle(leg)}
      />
    </>
  );
}
