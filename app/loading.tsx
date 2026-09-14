export default function Loading() {
  return (
    <div className="flex min-h-dvh bg-page" aria-busy="true" aria-label="Loading dashboard">
      <div className="hidden w-[238px] shrink-0 border border-black shadow-[1px_0_0_#232323] lg:block" />
      <div className="flex flex-1 flex-col gap-4 p-3">
        <div className="h-[38px]" />
        <div className="h-[42px] w-[260px] animate-pulse rounded-[6px] bg-white/[0.03]" />
        <div className="h-[36px] w-[378px] animate-pulse rounded-[8px] bg-white/[0.03]" />
        <div className="h-[110px] animate-pulse rounded-[6px] bg-white/[0.03]" />
        <div className="h-[260px] animate-pulse rounded-[6px] bg-white/[0.03]" />
      </div>
    </div>
  );
}
