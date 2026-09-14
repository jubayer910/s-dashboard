import {
  Analytics01Icon,
  AnalyticsUpIcon,
  Briefcase02Icon,
  Calendar03Icon,
  ChartUpIcon,
  Home01Icon,
  Idea01Icon,
  Invoice01Icon,
  Layers01Icon,
  Share01Icon,
  UserGroupIcon,
  UserSearch01Icon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export interface NavItem {
  label: string;
  href: string;
  icon: IconSvgElement;
}

export const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Dashboard",
    items: [
      { label: "Home", href: "/", icon: Home01Icon },
      { label: "Business", href: "/business", icon: Briefcase02Icon },
      { label: "Customer insights", href: "/customer-insights", icon: UserSearch01Icon },
      { label: "Processes", href: "/processes", icon: WorkflowSquare01Icon },
      { label: "Insights", href: "/insights", icon: Idea01Icon },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Numbers", href: "/team/numbers", icon: AnalyticsUpIcon },
      { label: "Customers", href: "/team/customers", icon: UserGroupIcon },
      { label: "Processes", href: "/team/processes", icon: WorkflowSquare01Icon },
      { label: "Insights", href: "/team/insights", icon: Idea01Icon },
      { label: "Collections", href: "/team/collections", icon: Layers01Icon },
    ],
  },
  {
    label: "Performance",
    items: [
      { label: "Weekly numbers", href: "/performance/weekly-numbers", icon: Calendar03Icon },
      { label: "Weekly analysis", href: "/performance/weekly-analysis", icon: Analytics01Icon },
      { label: "Subscriptions", href: "/performance/subscriptions", icon: Invoice01Icon },
      { label: "Projections", href: "/performance/projections", icon: ChartUpIcon },
    ],
  },
  {
    label: "Network",
    items: [
      { label: "Network", href: "/network", icon: Share01Icon },
      { label: "Boardplan", href: "/network/boardplan", icon: Layers01Icon },
    ],
  },
];
