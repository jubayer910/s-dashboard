"use client";

import { Popover } from "@base-ui/react/popover";
import {
  CrownIcon,
  DashboardSpeed01Icon,
  Message01Icon,
  Notification02Icon,
  Settings01Icon,
  TaskDone01Icon,
} from "@hugeicons/core-free-icons";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions";
import { Icon, type IconData } from "@/components/ui/icon";
import { Menu, MenuCheckboxItem } from "@/components/ui/menu";
import { Divider, iconButtonClass, secondaryButtonClass } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import type { NotificationData, NotificationKind } from "@/lib/types";
import { useShell } from "./shell-provider";

const KIND_ICON: Record<NotificationKind, IconData> = {
  tier: CrownIcon,
  report: TaskDone01Icon,
  alert: DashboardSpeed01Icon,
  mention: Message01Icon,
};

type Filter = "all" | "mention" | "report";

function Title({ item }: { item: NotificationData }) {
  if (!item.highlight || !item.title.includes(item.highlight)) return <>{item.title}</>;
  const [before, after] = item.title.split(item.highlight);
  return (
    <>
      {before}
      <span className="text-negative-soft">{item.highlight}</span>
      {after}
    </>
  );
}

/* Notification item */
function NotificationItem({ item, onSelect }: { item: NotificationData; onSelect: (item: NotificationData) => void }) {
  const unread = !item.readAt;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex w-full items-start gap-3 rounded-[6px] border border-transparent p-[10px] text-left outline-none hover:nav-surface focus-visible:nav-surface"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-raised text-label">
          <Icon icon={KIND_ICON[item.kind]} size={16} className={item.kind === "alert" ? "text-negative-soft" : undefined} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className={cn("text-[14px] leading-5 font-medium tracking-[-0.084px] text-pretty", unread ? "text-ink" : "text-muted-2")}>
            <Title item={item} />
          </span>
          <span className="flex items-center gap-[6px] text-[12px] leading-4 text-muted-2">
            <span>{relativeTime(item.createdAt)}</span>
            <span aria-hidden className="size-[3px] rounded-full bg-[#6b6b6b]" />
            <span className="truncate">{item.source}</span>
          </span>
        </span>
        <span className="pt-[6px]">
          <span
            aria-label={unread ? "Unread" : undefined}
            className={cn(
              "block size-2 rounded-[2px] bg-brand shadow-[inset_0_3.5px_3.5px_rgb(255_255_255/0.29)] transition-[opacity,scale,filter] duration-300 ease-[var(--ease-icon)]",
              unread ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
            )}
          />
        </span>
      </button>
    </li>
  );
}

export function NotificationsPopover() {
  const { notifications, workspace, openTeam } = useShell();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [, startTransition] = useTransition();
  const [items, markOptimistic] = useOptimistic(notifications, (current, id: number | "all") =>
    current.map((n) => (id === "all" || n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)),
  );

  const unread = items.filter((n) => !n.readAt).length;
  const mentions = items.filter((n) => n.kind === "mention").length;
  const filtered = items.filter((n) => (filter === "all" || n.kind === filter) && (!onlyUnread || !n.readAt));
  const visible = showAll ? filtered : filtered.slice(0, 4);

  const select = (item: NotificationData) => {
    if (!item.readAt) {
      startTransition(async () => {
        markOptimistic(item.id);
        const result = await markNotificationRead(item.id);
        if (!result.ok) toast.error(result.error);
      });
    }
    if (item.legId) {
      setOpen(false);
      openTeam(item.legId);
    }
  };

  const markAll = () => {
    startTransition(async () => {
      markOptimistic("all");
      const result = await markAllNotificationsRead(workspace.id);
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger aria-label={`Notifications, ${unread} unread`} className={cn(iconButtonClass, "relative")}>
        <Icon icon={Notification02Icon} size={18} />
        <span
          aria-hidden
          className={cn(
            "absolute top-[6px] right-[6px] size-[6px] rounded-full bg-brand ring-2 ring-raised transition-[opacity,scale,filter] duration-300 ease-[var(--ease-icon)]",
            unread > 0 ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
          )}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={6} collisionPadding={12} className="z-50">
          <Popover.Popup className="overlay-surface pop-panel w-[384px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[12px] outline-none">
            <div className="flex items-center justify-between px-4 pt-[14px] pb-3">
              <Popover.Title className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">Notifications</Popover.Title>
              <button
                type="button"
                onClick={markAll}
                disabled={unread === 0}
                className="rounded-[4px] text-[12px] leading-4 text-brand outline-none hover:underline disabled:pointer-events-none disabled:text-muted"
              >
                Mark all as read
              </button>
            </div>
            <div className="px-4 pb-3">
              <Segmented<Filter>
                label="Filter notifications"
                value={filter}
                onValueChange={(value) => {
                  setFilter(value);
                  setShowAll(false);
                }}
                options={[
                  { value: "all", label: <>All <span className="tnum font-mono text-[11px] text-brand">{unread}</span></> },
                  { value: "mention", label: <>Mentions <span className="tnum font-mono text-[11px] text-muted">{mentions}</span></> },
                  { value: "report", label: "Reports" },
                ]}
              />
            </div>
            <Divider />
            {visible.length > 0 ? (
              <ul className="flex max-h-[360px] flex-col gap-[2px] overflow-y-auto p-[6px]">
                {visible.map((item) => (
                  <NotificationItem key={item.id} item={item} onSelect={select} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="grid size-10 place-items-center rounded-full border border-line bg-raised text-muted">
                  <Icon icon={Notification02Icon} size={18} />
                </span>
                <p className="text-[14px] font-medium text-ink">You’re all caught up</p>
                <p className="text-[12px] text-muted-2">New team events, reports and mentions will show up here.</p>
              </div>
            )}
            <Divider />
            <div className="flex items-center justify-between px-3 py-[10px]">
              <button
                type="button"
                className={secondaryButtonClass}
                disabled={filtered.length <= 4}
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? "Show fewer" : `View all notifications`}
              </button>
              <Menu
                align="end"
                triggerLabel="Notification settings"
                triggerClassName={iconButtonClass}
                trigger={<Icon icon={Settings01Icon} size={16} />}
                width={200}
              >
                <MenuCheckboxItem checked={onlyUnread} onCheckedChange={setOnlyUnread} label="Only show unread" />
              </Menu>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
