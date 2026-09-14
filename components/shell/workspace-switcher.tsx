"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ArrowDown01Icon, Logout01Icon, Settings01Icon, Tick02Icon, UserAdd02Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { MenuGroup, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import type { Workspace } from "@/lib/types";
import { useShell } from "./shell-provider";

function WorkspaceLogo({ workspace, size = 40 }: { workspace: Workspace; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-[7px] bg-raised"
      style={{ width: size, height: size }}
    >
      {workspace.id === "stride-admin" ? (
        <Image src="/stride-logomark.svg" alt="" width={Math.round(size * 0.66)} height={Math.round(size * 0.6)} style={{ height: "auto" }} priority />
      ) : (
        <span className="text-[14px] leading-none font-medium text-nav">{workspace.initials}</span>
      )}
    </span>
  );
}

/* Workspace row + switcher menu (from the sidebar logo block) */
export function WorkspaceSwitcher() {
  const { workspace, workspaces, switchWorkspace, openDialog } = useShell();
  const [keyboard, setKeyboard] = useState(false);

  return (
    <BaseMenu.Root onOpenChange={(_, details) => setKeyboard(details.event instanceof KeyboardEvent)}>
      <BaseMenu.Trigger
        aria-label={`Switch workspace, current: ${workspace.name}`}
        className="group flex w-full items-center justify-between gap-[10px] rounded-[6px] border border-transparent p-[3.5px] text-left outline-none hover:nav-surface data-[popup-open]:nav-surface focus-visible:outline-2 focus-visible:outline-lime"
      >
        <span className="flex min-w-0 items-center gap-[10px]">
          <span className="pressable">
            <WorkspaceLogo workspace={workspace} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[16px] leading-[1.4] font-medium tracking-[-0.32px] text-white">{workspace.name}</span>
            <span className="truncate text-[12px] leading-[1.5] tracking-[-0.12px] text-axis">{workspace.role}</span>
          </span>
        </span>
        <Icon
          icon={ArrowDown01Icon}
          size={16}
          className="mr-1 text-muted-2 opacity-0 transition-[opacity,rotate] duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[popup-open]:rotate-180 group-data-[popup-open]:opacity-100"
        />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner align="start" sideOffset={8} className="z-50 outline-none">
          <BaseMenu.Popup data-kbd={keyboard || undefined} className="overlay-surface pop-menu w-[238px] rounded-[10px] p-1 outline-none">
            <MenuGroup label="Workspaces">
              {workspaces.map((w) => (
                <BaseMenu.Item
                  key={w.id}
                  onClick={() => w.id !== workspace.id && switchWorkspace(w.id)}
                  className="flex w-full cursor-default items-center justify-between gap-2 rounded-[6px] border border-transparent p-[6px] outline-none select-none data-[highlighted]:nav-surface"
                >
                  <span className="flex min-w-0 items-center gap-[10px]">
                    <WorkspaceLogo workspace={w} size={32} />
                    <span className="flex min-w-0 flex-col">
                      <span className={cn("truncate text-[14px] leading-5 font-medium", w.id === workspace.id ? "text-white" : "text-nav")}>
                        {w.name}
                      </span>
                      <span className="truncate text-[12px] leading-4 text-axis">{w.role}</span>
                    </span>
                  </span>
                  {w.id === workspace.id ? <Icon icon={Tick02Icon} size={15} className="text-lime" /> : null}
                </BaseMenu.Item>
              ))}
            </MenuGroup>
            <MenuSeparator />
            <MenuItem icon={Settings01Icon} label="Workspace settings" onClick={() => openDialog({ kind: "settings" })} />
            <MenuItem icon={UserAdd02Icon} label="Invite members" onClick={() => openDialog({ kind: "invite" })} />
            <MenuSeparator />
            <MenuItem icon={Logout01Icon} label="Log out" meta="No sign-in yet" destructive disabled />
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
