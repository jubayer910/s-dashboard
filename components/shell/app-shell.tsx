import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ShellData } from "@/lib/types";
import { ShellDialogs } from "./shell-dialogs";
import { ShellProvider } from "./shell-provider";
import { MobileNav, Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ data, page, children }: { data: ShellData; page: string; children: ReactNode }) {
  return (
    <ShellProvider data={data}>
      <TooltipProvider>
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar page={page} />
            <div className="divider-h w-full" />
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          </div>
        </div>
        <MobileNav />
        <ShellDialogs />
        <Toaster
          position="bottom-right"
          gap={8}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "overlay-surface flex w-[min(356px,calc(100vw-32px))] items-center gap-3 rounded-[10px] px-4 py-3 text-[14px] leading-5 text-ink",
              icon: "text-brand",
              error: "[&_[data-icon]]:text-negative-soft",
            },
          }}
        />
      </TooltipProvider>
    </ShellProvider>
  );
}
