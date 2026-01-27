import { motion } from "framer-motion";
import { useState } from "react";
import { triggerHaptic } from "../../../utils/haptic";
import { formatCommission } from "../../../utils/formatting";
import type { DashboardData } from "../hooks/useReferralData";

interface DashboardTabProps {
  data: DashboardData;
  lastUpdated: Date | null;
  onShare: () => void;
  isSharing: boolean;
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardTab({
  data,
  lastUpdated,
  onShare,
  isSharing,
}: DashboardTabProps) {
  const [copied, setCopied] = useState(false);

  const paidCommission = data.stats.totalCommission - data.stats.pendingCommission;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      triggerHaptic("light");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="pb-8"
    >
      {/* Hero Card - Total Commission */}
      <motion.div variants={fadeInUp} className="px-5 mt-2 mb-2">
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-aiya-purple via-[#5C499D] to-[#7B68EE] shadow-[0_12px_40px_rgba(58,35,181,0.35)]">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="relative p-7 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <p className="text-white/90 text-base font-medium tracking-wide">
                รายได้สะสม
              </p>
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                <span className="material-symbols-outlined text-white text-sm">
                  trending_up
                </span>
                <span className="text-white text-xs font-bold">ใช้งานอยู่</span>
              </div>
            </div>
            <div className="mt-3">
              <h1 className="text-white text-[2.75rem] font-extrabold tracking-tight leading-none drop-shadow-lg">
                ฿ {formatCommission(data.stats.totalCommission)}
              </h1>
              <p className="text-white/80 text-sm font-medium mt-2">
                อัปเดตเมื่อ {lastUpdated ? "เมื่อสักครู่" : "เร็วๆ นี้"}
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((data.stats.totalCommission / 2000000) * 100, 100)}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-bold text-white ml-4 whitespace-nowrap">
                เป้าหมาย: ฿ 20k
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-5 p-5">
        {/* Total Referrals */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-blue-500/20 shadow-sm hover:border-blue-500/40 transition-colors"
        >
          <div className="size-11 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium leading-normal mb-1">
              ผู้ใช้โค้ด
            </p>
            <p className="text-white tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
              {data.stats.totalRegistrations} คน
            </p>
          </div>
        </motion.div>

        {/* Pending */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-purple-500/20 shadow-sm hover:border-purple-500/40 transition-colors"
        >
          <div className="size-11 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
            <span className="material-symbols-outlined">pending</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium leading-normal mb-1">
              รอตรวจสอบ
            </p>
            <p className="text-purple-400 tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
              ฿{formatCommission(data.stats.pendingCommission)}
            </p>
          </div>
        </motion.div>

        {/* Paid */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-emerald-500/20 shadow-sm hover:border-emerald-500/40 transition-colors"
        >
          <div className="size-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium leading-normal mb-1">
              จ่ายแล้ว
            </p>
            <p className="text-emerald-400 tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
              ฿{formatCommission(paidCommission)}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Referral Code Coupon */}
      <motion.div variants={fadeInUp} className="px-5 pb-8">
        <div className="relative group">
          <motion.div
            whileHover={{ scale: 1.01, y: -4 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/30"
          >
            {/* Top Section */}
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-aiya-purple px-6 pt-8 pb-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              <div className="absolute top-4 left-6 text-yellow-300/70 text-lg animate-[twinkle_2s_ease-in-out_infinite]">
                ✦
              </div>
              <div className="absolute top-8 right-8 text-white/40 text-sm animate-[twinkle_2.5s_ease-in-out_infinite_0.5s]">
                ✧
              </div>
              <div className="absolute bottom-6 left-10 text-blue-200/50 text-xs animate-[twinkle_3s_ease-in-out_infinite_1s]">
                ✦
              </div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <span
                  className="material-symbols-outlined text-white text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  redeem
                </span>
              </motion.div>

              <h3 className="text-white font-bold text-lg mb-1">
                รหัสแนะนำพิเศษ
              </h3>
              <p className="text-white/70 text-sm">
                แชร์รหัสนี้ให้เพื่อนเพื่อรับค่าคอมมิชชั่น
              </p>
            </div>

            {/* Cutouts */}
            <div className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-[#0a1628] rounded-full shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)]"></div>
            <div className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-[#0a1628] rounded-full shadow-[inset_-2px_0_4px_rgba(0,0,0,0.3)]"></div>

            {/* Bottom Section */}
            <div className="bg-gradient-to-br from-purple-600 via-aiya-purple to-purple-900 px-6 pt-8 pb-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-white/20"></div>
              <div className="absolute top-4 left-8 text-yellow-300/60 text-sm animate-[twinkle_2s_ease-in-out_infinite_0.3s]">
                ✨
              </div>
              <div className="absolute top-6 right-6 text-pink-300/50 text-xs animate-[twinkle_2.5s_ease-in-out_infinite_0.7s]">
                ✦
              </div>
              <div className="absolute bottom-12 left-6 text-blue-300/40 text-xs animate-[twinkle_3s_ease-in-out_infinite_1.2s]">
                ✧
              </div>
              <div className="absolute bottom-8 right-10 text-yellow-200/50 text-sm animate-[float_3s_ease-in-out_infinite]">
                ⭐
              </div>

              <p className="text-purple-200/80 text-sm font-medium text-center mb-3 tracking-wide uppercase">
                Affiliate Code
              </p>

              <div className="text-center mb-6 relative">
                <span className="text-white font-black text-4xl tracking-[0.15em] font-mono drop-shadow-lg">
                  {data.affiliate.affiliateCode}
                </span>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => copyToClipboard(data.affiliate.affiliateCode)}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  copied
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
                    : "bg-white text-purple-700 shadow-lg shadow-white/20 hover:shadow-xl"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {copied ? (
                    <>
                      <span className="material-symbols-outlined text-xl">
                        check_circle
                      </span>
                      คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">
                        content_copy
                      </span>
                      คัดลอกรหัส
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* LINE Share Button */}
      <motion.div variants={fadeInUp} className="px-5">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            triggerHaptic("medium");
            onShare();
          }}
          disabled={isSharing}
          className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl py-5 bg-[#06C755] transition-all duration-300 text-white shadow-xl shadow-green-900/40 ${
            isSharing ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          <div className="relative flex items-center justify-center gap-3">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            <span className="text-xl font-bold">
              {isSharing ? "กำลังแชร์..." : "แชร์ให้เพื่อนใน LINE"}
            </span>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
