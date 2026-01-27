import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { triggerHaptic } from "../../../utils/haptic";
import { formatCommission } from "../../../utils/formatting";
import type { DashboardData } from "../hooks/useReferralData";

interface DashboardTabProps {
  data: DashboardData;
  lastUpdated: Date | null;
  onShare: () => void;
  isSharing: boolean;
  referrals?: Array<{ createdAt: string }>;
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardTab({
  data,
  onShare,
  isSharing,
  referrals = [],
}: DashboardTabProps) {
  const [copied, setCopied] = useState(false);

  const paidCommission = data.stats.totalCommission - data.stats.pendingCommission;
  const growthPercentage = 12.5;

  // Calculate 7-day registration data
  const chartData = useMemo(() => {
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize array with 7 days
    const dataPoints = Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date,
        count: 0,
        label: date.toLocaleDateString("th-TH", { weekday: "short" }).charAt(0),
      };
    });

    // Count referrals for each day
    referrals.forEach((referral) => {
      const refDate = new Date(referral.createdAt);
      refDate.setHours(0, 0, 0, 0);

      const dayIndex = dataPoints.findIndex(
        (point) => point.date.getTime() === refDate.getTime()
      );

      if (dayIndex !== -1) {
        dataPoints[dayIndex].count++;
      }
    });

    return dataPoints;
  }, [referrals]);

  // Generate SVG path from data
  const { path, maxCount } = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.count), 1);
    const width = 300;
    const height = 100;
    const padding = 20;
    const stepX = width / (chartData.length - 1 || 1);

    const points = chartData.map((point, i) => {
      const x = i * stepX;
      const y = height - padding - ((point.count / max) * (height - padding * 2));
      return { x, y };
    });

    // Create smooth curve path
    let pathStr = `M${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;

      pathStr += ` C${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
    }

    return { path: pathStr, maxCount: max };
  }, [chartData]);

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
      className="px-5 pt-4 flex flex-col gap-4 bg-[#0F1216] min-h-[calc(100vh-120px)] font-sans"
    >
      {/* Hero Card - Total Revenue */}
      <motion.div
        variants={fadeInUp}
        className="w-full bg-[#1A1D21] rounded-2xl p-5 relative overflow-hidden border border-white/5 shadow-xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance_wallet
                </span>
              </div>
              <span className="text-gray-400 text-xs font-medium">รายได้รวม</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-500/20 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-green-400 text-sm">trending_up</span>
              <span className="text-green-400 text-xs font-bold">+{growthPercentage}%</span>
            </div>
          </div>
          <h1 className="text-[2rem] font-bold text-white tracking-tight leading-none">
            <span className="text-yellow-400">฿</span> {formatCommission(data.stats.totalCommission)}
          </h1>
        </div>
      </motion.div>

      {/* Stats Grid - Pending & Approved */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
        {/* Pending Card */}
        <div className="bg-[#1A1D21] rounded-2xl p-4 relative overflow-hidden border border-white/5 shadow-xl">
          {/* Watermark Icon */}
          <span className="material-symbols-outlined text-orange-500/10 text-[52px] absolute top-1 right-1 leading-none">
            pending_actions
          </span>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <span className="material-symbols-outlined text-orange-400 text-lg">schedule</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs font-medium mb-2">รอตรวจสอบ</p>
            <p className="text-xl font-bold text-white">฿ {formatCommission(data.stats.pendingCommission)}</p>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-[#1A1D21] rounded-2xl p-4 relative overflow-hidden border border-white/5 shadow-xl">
          {/* Watermark Icon */}
          <span className="material-symbols-outlined text-green-500/10 text-[52px] absolute top-1 right-1 leading-none">
            verified
          </span>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs font-medium mb-2">อนุมัติแล้ว</p>
            <p className="text-xl font-bold text-white">฿ {formatCommission(paidCommission)}</p>
          </div>
        </div>
      </motion.div>

      {/* Registrations Card */}
      <motion.div
        variants={fadeInUp}
        className="bg-[#1A1D21] rounded-2xl p-4 flex items-center justify-between border border-white/5 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-cyan-400 text-xl">group_add</span>
          </div>
          <p className="text-white text-sm font-medium">จำนวนลูกค้า</p>
        </div>
        <p className="text-2xl font-bold text-white">
          {data.stats.totalRegistrations} <span className="text-sm font-normal text-gray-500">คน</span>
        </p>
      </motion.div>

      {/* Growth Trend Chart */}
      <motion.div variants={fadeInUp} className="bg-[#1A1D21] rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white text-base font-bold">แนวโน้มการเติบโต</h3>
            <p className="text-gray-500 text-xs">จำนวนลูกค้า 7 วันย้อนหลัง</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full border border-yellow-400/30 text-yellow-400 text-[10px] font-semibold">
              {maxCount > 0 ? `สูงสุด ${maxCount} คน` : "ยังไม่มีข้อมูล"}
            </span>
          </div>
        </div>
        <div className="relative w-full h-28">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 100">
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#FACC15" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#FACC15" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            {maxCount > 0 ? (
              <>
                {/* Area Fill */}
                <path
                  d={`${path} L300,100 L0,100 Z`}
                  fill="url(#areaGradient)"
                />
                {/* Line Stroke */}
                <path
                  d={path}
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Glow Effect */}
                <path
                  d={path}
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.2"
                  filter="blur(4px)"
                />
              </>
            ) : (
              /* Empty state line */
              <line
                x1="0"
                y1="80"
                x2="300"
                y2="80"
                stroke="#FACC15"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.3"
              />
            )}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-500 font-medium px-1">
            {chartData.map((point, i) => (
              <span key={i}>{point.label}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        variants={fadeInUp}
        className="bg-[#1A1D21] rounded-2xl p-5 border border-white/5 shadow-xl relative overflow-hidden"
      >
        {/* Subtle Gold Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                redeem
              </span>
            </div>
            <span className="text-white text-sm font-bold">รหัสแนะนำพิเศษ</span>
          </div>
          <p className="text-gray-500 text-xs mb-4">แชร์รหัสนี้ให้เพื่อนเพื่อรับค่าคอมมิชชั่น</p>

          <div className="bg-[#0F1216] rounded-xl p-4 mb-4 text-center border border-white/5">
            <span className="text-[10px] text-gray-500 block mb-2 uppercase tracking-wider">Affiliate Code</span>
            <span className="text-white font-bold text-xl tracking-[0.15em]">
              {data.affiliate.affiliateCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => copyToClipboard(data.affiliate.affiliateCode)}
              className={`py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-[#2A2D31] text-white border border-white/5 hover:bg-[#32363B]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  {copied ? "check_circle" : "content_copy"}
                </span>
                {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                triggerHaptic("medium");
                onShare();
              }}
              disabled={isSharing}
              className={`py-3 rounded-xl font-bold text-sm bg-yellow-400 text-black transition-all duration-300 shadow-lg shadow-yellow-400/20 hover:bg-yellow-300 ${
                isSharing ? "opacity-50" : ""
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base">share</span>
                {isSharing ? "กำลังแชร์..." : "แชร์ลิงก์"}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* LINE Share Button */}
      <motion.div variants={fadeInUp} className="pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            triggerHaptic("medium");
            onShare();
          }}
          disabled={isSharing}
          className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl py-4 bg-[#06C755] transition-all duration-300 text-white shadow-xl shadow-[#06C755]/20 ${
            isSharing ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          <div className="relative flex items-center justify-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            <span className="text-base font-bold">
              {isSharing ? "กำลังแชร์..." : "แชร์ให้เพื่อนใน LINE"}
            </span>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
