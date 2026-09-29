import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { NAV } from "@/lib/nav";
import { TitleBlock, secondaryButtonClass } from "@/components/ui/primitives";
import { getShellData } from "@/lib/queries";

export default async function SectionPage(props: PageProps<"/[...section]">) {
  const { section } = await props.params;
  const search = await props.searchParams;
  const href = `/${section.join("/")}`;
  const item = NAV.flatMap((group) => group.items.map((i) => ({ ...i, group: group.label }))).find((i) => i.href === href);
  if (!item) notFound();

  const ws = typeof search.ws === "string" ? search.ws : null;
  const shell = await getShellData(ws);

  return (
    <AppShell data={shell} page={item.label}>
      <div className="flex flex-col gap-6 px-3 py-3">
        <TitleBlock as="h1" title={item.label} subtitle={`${item.group} · ${shell.workspace.name}`} />
      </div>
      <div className="divider-h w-full" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <p className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">This page isn’t designed yet</p>
        <p className="max-w-[420px] text-[14px] leading-5 text-muted">
          The Vantage design currently covers Performance overview. {item.label} will use the same components once its screens are ready.
        </p>
        <Link href={`/?ws=${shell.workspace.id}`} className={`${secondaryButtonClass} mt-2`}>
          Back to Performance overview
        </Link>
      </div>
    </AppShell>
  );
}
