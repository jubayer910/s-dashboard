"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, use, useCallback, useMemo, useState, useTransition, type ReactNode } from "react";
import type { ShellData } from "@/lib/types";

type DialogState =
  | { kind: null }
  | { kind: "message"; legId: number; legName: string; seq: number }
  | { kind: "invite"; seq: number }
  | { kind: "settings"; seq: number };

type DialogRequest =
  | { kind: "message"; legId: number; legName: string }
  | { kind: "invite" }
  | { kind: "settings" };

interface ShellContextValue extends ShellData {
  dialog: DialogState;
  openDialog: (dialog: DialogRequest) => void;
  closeDialog: () => void;
  switchWorkspace: (id: string) => void;
  switching: boolean;
  /** Sidebar drawer on screens narrower than the persistent sidebar. */
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  /** Overridden by the dashboard so notifications open the team modal in place. */
  openTeam: (legId: number) => void;
  setOpenTeamHandler: (handler: ((legId: number) => void) | null) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ data, children }: { data: ShellData; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [switching, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>({ kind: null });
  const [navOpen, setNavOpen] = useState(false);
  const [openTeamHandler, setOpenTeamHandlerState] = useState<((legId: number) => void) | null>(null);

  const setOpenTeamHandler = useCallback((handler: ((legId: number) => void) | null) => {
    setOpenTeamHandlerState(() => handler);
  }, []);

  const switchWorkspace = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("ws", id);
      params.delete("team");
      setNavOpen(false);
      startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  const value = useMemo<ShellContextValue>(
    () => ({
      ...data,
      dialog,
      openDialog: (request) => {
        setNavOpen(false);
        setDialog({ ...request, seq: Date.now() } as DialogState);
      },
      closeDialog: () => setDialog({ kind: null }),
      switchWorkspace,
      switching,
      navOpen,
      setNavOpen,
      openTeam: (legId) => {
        if (openTeamHandler) openTeamHandler(legId);
        else router.push(`/?ws=${data.workspace.id}&team=${legId}`);
      },
      setOpenTeamHandler,
    }),
    [data, dialog, switchWorkspace, switching, navOpen, openTeamHandler, router, setOpenTeamHandler],
  );

  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShell() {
  const context = use(ShellContext);
  if (!context) throw new Error("useShell must be used inside ShellProvider");
  return context;
}
