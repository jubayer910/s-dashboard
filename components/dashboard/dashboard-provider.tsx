"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useShell } from "@/components/shell/shell-provider";
import { type DashboardState, toQuery } from "@/lib/dashboard-state";
import type { DashboardData } from "@/lib/types";

interface DashboardContextValue {
  data: DashboardData;
  /** State as the user last chose it; updates instantly while the server renders. */
  state: DashboardState;
  pending: boolean;
  update: (patch: Partial<DashboardState>) => void;
  /** Query string for API calls and exports, e.g. "?range=8w&ws=stride-admin". */
  query: string;
  teamId: number | null;
  openTeam: (id: number) => void;
  closeTeam: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ data, children }: { data: DashboardData; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setOpenTeamHandler } = useShell();
  const [pending, startTransition] = useTransition();
  const [state, setOptimisticState] = useOptimistic(data.state, (current, patch: Partial<DashboardState>) => ({
    ...current,
    ...patch,
  }));

  const [teamId, setTeamId] = useState<number | null>(() => {
    const id = Number(searchParams.get("team"));
    return Number.isInteger(id) && id > 0 ? id : null;
  });

  const syncTeamParam = useCallback((id: number | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("team", String(id));
    else url.searchParams.delete("team");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const openTeam = useCallback(
    (id: number) => {
      setTeamId(id);
      syncTeamParam(id);
    },
    [syncTeamParam],
  );

  const closeTeam = useCallback(() => {
    setTeamId(null);
    syncTeamParam(null);
  }, [syncTeamParam]);

  useEffect(() => {
    setOpenTeamHandler(openTeam);
    return () => setOpenTeamHandler(null);
  }, [openTeam, setOpenTeamHandler]);

  const update = useCallback(
    (patch: Partial<DashboardState>) => {
      const next = { ...state, ...patch, ws: data.workspace.id };
      const params = new URLSearchParams(toQuery(next));
      if (teamId) params.set("team", String(teamId));
      const search = params.toString();
      startTransition(() => {
        setOptimisticState(patch);
        router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
      });
    },
    [state, data.workspace.id, teamId, pathname, router, setOptimisticState],
  );

  const value = useMemo<DashboardContextValue>(
    () => ({
      data,
      state,
      pending,
      update,
      query: toQuery({ ...state, ws: data.workspace.id }),
      teamId,
      openTeam,
      closeTeam,
    }),
    [data, state, pending, update, teamId, openTeam, closeTeam],
  );

  return <DashboardContext value={value}>{children}</DashboardContext>;
}

export function useDashboard() {
  const context = use(DashboardContext);
  if (!context) throw new Error("useDashboard must be used inside DashboardProvider");
  return context;
}
