import { AppShell } from "@/components/shell/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { parseState } from "@/lib/dashboard-state";
import { getDashboardData } from "@/lib/queries";

export default async function Page(props: PageProps<"/">) {
  const state = parseState(await props.searchParams);
  const data = await getDashboardData(state);
  const shell = {
    workspace: data.workspace,
    workspaces: data.workspaces,
    notifications: data.notifications,
    memberCount: data.memberCount,
  };

  return (
    <AppShell data={shell} page="Performance overview">
      <DashboardView data={{ ...data, state: { ...data.state, ws: data.workspace.id } }} />
    </AppShell>
  );
}
