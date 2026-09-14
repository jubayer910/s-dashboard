"use client";

import { ArrowRight01Icon, Home01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useShell } from "./shell-provider";
import { NotificationsPopover } from "./notifications-popover";

function Clock() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const format = () => {
      const parts = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).formatToParts(new Date());
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
      setText(`${get("hour")}:${get("minute")} ${get("timeZoneName")}`);
    };
    format();
    const id = window.setInterval(format, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className="tnum min-w-[60px] font-mono text-[11px] leading-[15px] text-muted" suppressHydrationWarning>
      {text ?? "--:--"}
    </time>
  );
}

export function TopBar({ page }: { page: string }) {
  const { workspace } = useShell();
  return (
    <div className="flex h-[62px] shrink-0 items-center justify-between gap-4 px-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-[7px] text-[12px] leading-none font-medium text-ink">
          <li>
            <Link href={`/?ws=${workspace.id}`} className="flex items-center gap-1 opacity-50 transition-opacity duration-150 ease-out hover:opacity-80">
              <Icon icon={Home01Icon} size={13} />
              Home
            </Link>
          </li>
          <li aria-hidden className="text-ink">
            <Icon icon={ArrowRight01Icon} size={13} />
          </li>
          <li aria-current="page">{page}</li>
        </ol>
      </nav>
      <div className="flex items-center gap-3">
        <Clock />
        <NotificationsPopover />
      </div>
    </div>
  );
}
