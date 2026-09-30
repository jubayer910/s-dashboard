"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { Icon } from "@/components/ui/icon";
import { Divider, IconButton, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/nav";
import { useMediaQuery } from "@/lib/use-media-query";
import { useShell } from "./shell-provider";
import { WorkspaceSwitcher } from "./workspace-switcher";

/* Workspace row + grouped navigation, shared by the persistent sidebar and the drawer */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { workspace, memberCount } = useShell();

  return (
    <nav aria-label="Main" className="mt-[6px] flex flex-col gap-4 pb-6">
      <Divider />
      {NAV.map((group) => (
        <Fragment key={group.label}>
          <div className="flex flex-col">
            <SectionLabel>{group.label}</SectionLabel>
            <ul className="flex w-full flex-col items-end pr-[10px]">
              {group.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname === item.href;
                return (
                  <li key={item.href} className={cn("flex w-full items-center", active ? "gap-[7px]" : "pl-[13px]")}>
                    {active ? (
                      <span className="h-[26px] w-[5px] shrink-0 rounded-r-[6px] bg-brand shadow-[0_0_7.2px_rgb(123_91_255/0.5)]" />
                    ) : null}
                    <Link
                      href={`${item.href}?ws=${workspace.id}`}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "flex h-[30px] min-w-0 flex-1 items-center justify-between rounded-[6px] border border-transparent p-[6px] text-[14px] tracking-[-0.28px] text-nav outline-none drop-shadow-[0_0_2.3px_rgb(0_0_0/0.5)] max-lg:h-9",
                        active ? "nav-surface" : "transition-[background-color] duration-100 ease-out hover:bg-raised/60 hover:duration-0",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-[6px]">
                        <Icon icon={item.icon} size={15} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.href === "/" ? (
                        <span className="tnum rounded-[18px] bg-chip px-[5px] py-[3px] text-[12px] leading-3 font-medium tracking-[-0.24px] text-[#cfcfcf]">
                          {memberCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <Divider />
        </Fragment>
      ))}
    </nav>
  );
}

/* Persistent sidebar, 1024px and up */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[238px] shrink-0 flex-col overflow-y-auto border border-black shadow-[1px_0_0_#232323] lg:flex">
      <div className="px-[8px] pt-[7px] pb-[5px]">
        <WorkspaceSwitcher />
      </div>
      <SidebarNav />
    </aside>
  );
}

/* Below 1024px the same sidebar slides in from the left */
export function MobileNav() {
  const { navOpen, setNavOpen } = useShell();
  const desktop = useMediaQuery("(min-width: 1024px)");

  return (
    <BaseDialog.Root open={navOpen && !desktop} onOpenChange={setNavOpen}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="drawer-backdrop fixed inset-0 z-50 bg-black/64" />
        <BaseDialog.Popup className="drawer-popup fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[calc(100vw-48px)] flex-col overflow-y-auto overscroll-contain border-r border-black bg-page shadow-[1px_0_0_#232323,16px_0_40px_rgb(0_0_0/0.35)] outline-none">
          <BaseDialog.Title className="sr-only">Navigation</BaseDialog.Title>
          <div className="flex items-center gap-2 px-[8px] pt-[7px] pb-[5px]">
            <div className="min-w-0 flex-1">
              <WorkspaceSwitcher />
            </div>
            <BaseDialog.Close render={<IconButton icon={Cancel01Icon} label="Close navigation" iconSize={16} />} />
          </div>
          <SidebarNav onNavigate={() => setNavOpen(false)} />
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
