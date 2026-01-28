import { useEffect, useState, useMemo } from "react";
import liff from "@line/liff";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { triggerHaptic } from "../utils/haptic";

// Confetti particle component
const ConfettiParticle = ({
  index,
  color,
}: {
  index: number;
  color: string;
}) => {
  const style = useMemo(() => {
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = 3 + Math.random() * 2;
    const size = 6 + Math.random() * 6;

    return {
      left: `${left}%`,
      width: size,
      height: size,
      backgroundColor: color,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    };
  }, [color]);

  return (
    <div
      key={index}
      className="confetti absolute top-0 rounded-sm"
      style={style}
    />
  );
};

export default function ThankYou() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // Protected Route: Redirect if accessed directly without registration data
  const hasRegistered = !!location.state?.affiliateCode;

  useEffect(() => {
    if (!hasRegistered) {
      navigate("/", { replace: true });
    }
  }, [hasRegistered, navigate]);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Early return if not registered - prevent rendering before redirect
  if (!hasRegistered) {
    return null;
  }

  // Get data from previous state
  const affiliateCode = location.state?.affiliateCode || "";
  const emailSent = location.state?.emailSent ?? true;
  const mainSystemSuccess = location.state?.mainSystemSuccess ?? true;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(affiliateCode);
      setCopied(true);
      triggerHaptic("light");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
      window.location.href =
        "https://web.aiya.ai/th/bootcamp/ai-empire/affiliate";
    } else {
      if (liff.isInClient()) {
        liff.closeWindow();
      } else {
        navigate("/");
      }
    }
  };

  const confettiColors = [
    "#A78BFA", // primary purple
    "#7C3AED", // primary-dark
    "#22D3EE", // accent cyan
    "#C4B5FD", // light purple
    "#818CF8", // indigo
  ];

  return (
    <div className="h-[100dvh] bg-[#0F1216] text-white flex flex-col relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              index={i}
              color={confettiColors[i % confettiColors.length]}
            />
          ))}
        </div>
      )}

      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content - Scrollable if needed but designed to fit */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pt-10 pb-4 overflow-y-auto">
        {/* Success Icon - Compact */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-success-pulse">
            <span className="material-symbols-outlined text-white text-3xl">
              check
            </span>
          </div>
        </motion.div>

        {/* Title - Compact */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-center mb-1"
        >
          ลงทะเบียนสำเร็จ!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm text-center mb-5"
        >
          ยินดีต้อนรับสู่ครอบครัว AI EMPIRE
        </motion.p>

        {/* Warnings - Compact (if any) */}
        {!emailSent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-amber-400 text-lg">
              warning
            </span>
            <p className="text-amber-200 text-xs">
              อีเมลยืนยันไม่สามารถส่งได้ กรุณาบันทึกรหัสด้านล่าง
            </p>
          </motion.div>
        )}

        {!mainSystemSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-red-400 text-lg">
              error
            </span>
            <p className="text-red-200 text-xs">
              รหัสอาจยังไม่พร้อมใช้งาน กรุณาติดต่อทีมงาน
            </p>
          </motion.div>
        )}

        {/* Affiliate Code Card - Compact & Prominent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1A1D21] rounded-2xl p-4 border border-white/5 mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
              รหัสพันธมิตรของคุณ
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                copied
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/10 text-white/70 active:bg-white/20"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </motion.button>
          </div>

          <p className="text-2xl font-bold text-white font-mono tracking-wider text-center py-1">
            {affiliateCode}
          </p>

          <p className="text-white/40 text-xs text-center mt-2">
            แชร์รหัสนี้เพื่อรับค่าคอมมิชชั่น
          </p>
        </motion.div>

        {/* Next Steps - Horizontal compact layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-1 min-h-0"
        >
          <p className="text-xs text-white/40 mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-sm">
              checklist
            </span>
            ขั้นตอนต่อไป
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#1A1D21] rounded-xl p-3 border border-white/5 text-center">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-cyan-400 text-base">
                  mail
                </span>
              </div>
              <p className="text-white/60 text-[10px] leading-tight">
                เช็คอีเมล
              </p>
            </div>

            <div className="bg-[#1A1D21] rounded-xl p-3 border border-white/5 text-center">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-green-400 text-base">
                  account_balance
                </span>
              </div>
              <p className="text-white/60 text-[10px] leading-tight">
                รอติดต่อ
              </p>
            </div>

            <div className="bg-[#1A1D21] rounded-xl p-3 border border-white/5 text-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-primary text-base">
                  share
                </span>
              </div>
              <p className="text-white/60 text-[10px] leading-tight">
                แชร์รหัส
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 px-5 pb-5 pt-3 bg-gradient-to-t from-[#0F1216] via-[#0F1216] to-transparent space-y-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic("medium");
            navigate("/portal");
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary-dark to-primary text-white font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">bar_chart</span>
          ดูสถิติของฉัน
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-sm"
        >
          ปิด
        </motion.button>
      </motion.div>
    </div>
  );
}
