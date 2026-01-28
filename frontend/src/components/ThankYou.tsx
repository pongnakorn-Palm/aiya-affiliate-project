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

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    <div className="min-h-[100dvh] bg-[#0F1216] text-white flex flex-col relative overflow-hidden">
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-16 pb-8">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-success-pulse">
              <span className="material-symbols-outlined text-white text-5xl">
                check
              </span>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center mb-2"
        >
          ลงทะเบียนสำเร็จ!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-center mb-8"
        >
          ยินดีต้อนรับสู่ครอบครัว AI EMPIRE
        </motion.p>

        {/* Warnings (if any) */}
        {!emailSent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3"
          >
            <span className="material-symbols-outlined text-amber-400 text-xl mt-0.5">
              warning
            </span>
            <div>
              <p className="text-amber-200 font-semibold text-sm">
                อีเมลยืนยันไม่สามารถส่งได้
              </p>
              <p className="text-amber-300/70 text-xs mt-1">
                กรุณาบันทึกรหัสพันธมิตรด้านล่างไว้
              </p>
            </div>
          </motion.div>
        )}

        {!mainSystemSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3"
          >
            <span className="material-symbols-outlined text-red-400 text-xl mt-0.5">
              error
            </span>
            <div>
              <p className="text-red-200 font-semibold text-sm">
                รหัสพันธมิตรอาจยังไม่พร้อมใช้งาน
              </p>
              <p className="text-red-300/70 text-xs mt-1">
                กรุณาติดต่อทีมงานเพื่อเปิดใช้งานรหัส
              </p>
            </div>
          </motion.div>
        )}

        {/* Affiliate Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1A1D21] rounded-2xl p-6 border border-white/5 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
              รหัสพันธมิตรของคุณ
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
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

          <p className="text-3xl font-bold text-white font-mono tracking-wider text-center py-2">
            {affiliateCode}
          </p>

          <p className="text-white/40 text-sm text-center mt-4">
            แชร์รหัสนี้เพื่อรับค่าคอมมิชชั่น
          </p>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1A1D21] rounded-2xl p-5 border border-white/5 mb-auto"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              checklist
            </span>
            ขั้นตอนต่อไป
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-cyan-400 text-sm">
                  mail
                </span>
              </div>
              <p className="text-white/70 text-sm">
                เช็คอีเมลเพื่อดูคู่มือและรายละเอียด
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-green-400 text-sm">
                  account_balance
                </span>
              </div>
              <p className="text-white/70 text-sm">
                ทีมงานจะติดต่อขอเลขบัญชีเมื่อมียอดขาย
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-sm">
                  share
                </span>
              </div>
              <p className="text-white/70 text-sm">
                แชร์รหัสให้เพื่อนได้ทันที!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic("medium");
              navigate("/portal");
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-dark to-primary text-white font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">bar_chart</span>
            ดูสถิติของฉัน
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-base"
          >
            ปิด
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
