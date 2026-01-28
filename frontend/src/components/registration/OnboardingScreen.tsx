import { motion } from "framer-motion";
import { ReactNode } from "react";

interface OnboardingScreenProps {
  icon: ReactNode;
  headline: string;
  subheadline: string;
  accentColor: string;
  showCTA?: boolean;
  ctaText?: string;
  onCTAClick?: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

export default function OnboardingScreen({
  icon,
  headline,
  subheadline,
  accentColor,
  showCTA = false,
  ctaText = "เริ่มสมัครเลย",
  onCTAClick,
}: OnboardingScreenProps) {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center px-8 bg-[#0F1216] relative overflow-hidden">
      {/* Background Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Content */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-32 h-32 rounded-3xl flex items-center justify-center mb-8"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          {icon}
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-4"
        >
          {headline}
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-base text-white/60 leading-relaxed"
        >
          {subheadline}
        </motion.p>

        {/* CTA Button (only on last screen) */}
        {showCTA && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCTAClick}
            className="mt-10 w-full py-4 rounded-2xl bg-gradient-to-r from-primary-dark to-primary text-white font-bold text-lg shadow-lg shadow-primary/30 active:opacity-90 transition-all"
          >
            {ctaText}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
