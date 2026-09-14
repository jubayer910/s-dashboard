"use client";

import { Divider } from "@/components/ui/primitives";
import type { DashboardData } from "@/lib/types";
import { DashboardProvider } from "./dashboard-provider";
import { InsightsColumn } from "./insights-column";
import { KpiStrip } from "./kpi";
import { PageHeader } from "./page-header";
import { PerformanceChart } from "./performance-chart";
import { ScopeTabs } from "./scope-tabs";
import { TeamDetailDialog } from "./team-detail-dialog";
import { TeamTable } from "./team-table";

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <DashboardProvider data={data}>
      <PageHeader />
      <Divider />
      <ScopeTabs />
      <Divider />
      <KpiStrip />
      <Divider />
      <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_1px_402px]">
        <div className="flex min-w-0 flex-col">
          <PerformanceChart />
          <TeamTable />
        </div>
        <Divider orientation="vertical" className="hidden xl:block" />
        <div className="border-t border-black shadow-[0_1px_0_#232323_inset] xl:border-t-0 xl:shadow-none">
          <InsightsColumn />
        </div>
      </div>
      <TeamDetailDialog />
    </DashboardProvider>
  );
}
