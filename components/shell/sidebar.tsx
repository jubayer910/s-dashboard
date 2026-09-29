"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { Icon } from "@/components/ui/icon";
import { Divider, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/nav";
import { useShell } from "./shell-provider";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function Sidebar() {
  const pathname = usePathname();
  const { workspace, memberCount } = useShell();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[238px] shrink-0 flex-col overflow-y-auto border border-black shadow-[1px_0_0_#232323] lg:flex">
      <div className="px-[8px] pt-[7px] pb-[5px]">
        <WorkspaceSwitcher />
      </div>
      <nav aria-label="Main" className="mt-[6px] flex flex-col gap-4 pb-6">
        <Divider />
        {NAV.map((group) => (
          <Fragment key={group.label}>
            <div className="flex flex-col">
              <SectionLabel>{group.label}</SectionLabel>
              <ul className="flex w-[226px] flex-col items-end">
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
                        className={cn(
                          "flex h-[30px] min-w-0 flex-1 items-center justify-between rounded-[6px] border border-transparent p-[6px] text-[14px] tracking-[-0.28px] text-nav outline-none drop-shadow-[0_0_2.3px_rgb(0_0_0/0.5)]",
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
    </aside>
  );
}
