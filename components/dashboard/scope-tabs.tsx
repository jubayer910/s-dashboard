"use client";

import { CrownIcon, User03Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Segmented } from "@/components/ui/segmented";
import { TAB_LABELS, type TabKey } from "@/lib/dashboard-state";
import { useDashboard } from "./dashboard-provider";

export function ScopeTabs() {
  const { state, update } = useDashboard();
  return (
    <div className="px-3 py-3">
      <Segmented<TabKey>
        label="Performance scope"
        value={state.tab}
        onValueChange={(tab) => update({ tab })}
        options={[
          { value: "me", label: TAB_LABELS.me, icon: User03Icon },
          { value: "team", label: TAB_LABELS.team, icon: UserGroupIcon },
          { value: "upper", label: TAB_LABELS.upper, icon: CrownIcon },
        ]}
      />
    </div>
  );
}
