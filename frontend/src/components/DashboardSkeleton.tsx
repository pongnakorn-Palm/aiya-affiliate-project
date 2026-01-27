export default function DashboardSkeleton() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#0F1216] animate-pulse">
      {/* Premium Gold Ambient Lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none"></div>

      {/* Header Skeleton */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-white/10"></div>
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 bg-white/10 rounded-lg"></div>
            <div className="h-4 w-28 bg-white/10 rounded-lg"></div>
          </div>
        </div>
        <div className="size-11 rounded-xl bg-white/10"></div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4 font-sans">
        {/* Hero Card Skeleton */}
        <div className="w-full bg-[#1A1D21] rounded-2xl p-5 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10"></div>
              <div className="h-4 w-36 bg-white/10 rounded-lg"></div>
            </div>
            <div className="h-7 w-20 bg-white/10 rounded-full"></div>
          </div>
          <div className="h-12 w-56 bg-white/10 rounded-lg"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1A1D21] rounded-2xl p-4 border border-white/5 shadow-xl">
            <div className="p-2 rounded-lg bg-white/10 w-10 h-10 mb-3"></div>
            <div className="h-3 w-16 bg-white/10 rounded-lg mb-1"></div>
            <div className="h-2 w-12 bg-white/5 rounded-lg mb-2"></div>
            <div className="h-6 w-28 bg-white/10 rounded-lg"></div>
          </div>
          <div className="bg-[#1A1D21] rounded-2xl p-4 border border-white/5 shadow-xl">
            <div className="p-2 rounded-lg bg-white/10 w-10 h-10 mb-3"></div>
            <div className="h-3 w-16 bg-white/10 rounded-lg mb-1"></div>
            <div className="h-2 w-12 bg-white/5 rounded-lg mb-2"></div>
            <div className="h-6 w-28 bg-white/10 rounded-lg"></div>
          </div>
        </div>

        {/* Registrations Card Skeleton */}
        <div className="bg-[#1A1D21] rounded-2xl p-4 border border-white/5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10"></div>
            <div>
              <div className="h-4 w-20 bg-white/10 rounded-lg mb-1"></div>
              <div className="h-3 w-16 bg-white/5 rounded-lg"></div>
            </div>
          </div>
          <div className="h-7 w-16 bg-white/10 rounded-lg"></div>
        </div>

        {/* Chart Skeleton */}
        <div className="bg-[#1A1D21] rounded-2xl p-5 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-5 w-28 bg-white/10 rounded-lg mb-1"></div>
              <div className="h-3 w-36 bg-white/5 rounded-lg"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-white/10 rounded-full"></div>
              <div className="w-6 h-6 bg-white/10 rounded-lg"></div>
            </div>
          </div>
          <div className="relative w-full h-28 bg-white/5 rounded-xl"></div>
        </div>

        {/* Referral Code Card Skeleton */}
        <div className="bg-[#1A1D21] rounded-2xl p-5 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/10"></div>
            <div className="h-4 w-32 bg-white/10 rounded-lg"></div>
          </div>
          <div className="h-3 w-48 bg-white/5 rounded-lg mb-4"></div>
          <div className="bg-[#0F1216] rounded-xl p-4 mb-4 border border-white/5">
            <div className="h-3 w-20 bg-white/10 rounded-lg mx-auto mb-2"></div>
            <div className="h-8 w-40 bg-white/10 rounded-lg mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-white/10 rounded-xl"></div>
            <div className="h-12 bg-yellow-400/20 rounded-xl"></div>
          </div>
        </div>

        {/* LINE Share Button Skeleton */}
        <div className="pb-4">
          <div className="h-14 bg-[#06C755]/20 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}
