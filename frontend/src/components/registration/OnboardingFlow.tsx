import { useState } from "react";
import { motion } from "framer-motion";
import SwipeableView from "../ui/SwipeableView";
import OnboardingScreen from "./OnboardingScreen";
import StepIndicator from "./components/StepIndicator";
import { triggerHaptic } from "../../utils/haptic";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// SVG Icons for each benefit
const MoneyIcon = () => (
  <svg
    className="w-16 h-16 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const GiftIcon = () => (
  <svg
    className="w-16 h-16 text-accent"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
    />
  </svg>
);

const RocketIcon = () => (
  <svg
    className="w-16 h-16 text-primary-dark"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
    />
  </svg>
);

const ONBOARDING_SCREENS = [
  {
    icon: <MoneyIcon />,
    headline: "สร้างรายได้เสริมง่ายๆ",
    subheadline: "รับค่าคอมมิชชั่นสูงสุด 7,000 บาท ต่อการแนะนำแต่ละครั้ง",
    accentColor: "#A78BFA", // primary purple
  },
  {
    icon: <GiftIcon />,
    headline: "ลูกค้าได้ส่วนลดทันที",
    subheadline: "คนที่คุณแนะนำได้รับส่วนลดสูงสุด 2,000 บาท ทันที",
    accentColor: "#22D3EE", // accent cyan
  },
  {
    icon: <RocketIcon />,
    headline: "เรียนรู้ AI ต่อยอดธุรกิจ",
    subheadline: "เข้าถึงความรู้และเครื่องมือ AI ที่ทันสมัยจาก AI EMPIRE",
    accentColor: "#7C3AED", // primary-dark
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastScreen = activeIndex === ONBOARDING_SCREENS.length - 1;

  return (
    <div className="relative min-h-[100dvh] bg-[#0F1216]">
      {/* Skip Button (not on last screen) */}
      {!isLastScreen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            triggerHaptic("light");
            onComplete();
          }}
          className="absolute top-12 right-5 z-20 px-4 py-2 text-white/50 text-sm font-medium active:text-white/80 transition-colors"
        >
          ข้าม
        </motion.button>
      )}

      {/* Swipeable Screens */}
      <SwipeableView activeIndex={activeIndex} onIndexChange={setActiveIndex}>
        {ONBOARDING_SCREENS.map((screen, index) => (
          <OnboardingScreen
            key={index}
            icon={screen.icon}
            headline={screen.headline}
            subheadline={screen.subheadline}
            accentColor={screen.accentColor}
            showCTA={index === ONBOARDING_SCREENS.length - 1}
            onCTAClick={onComplete}
          />
        ))}
      </SwipeableView>

      {/* Bottom Navigation - Minimal dots only */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2.5rem)" }}
      >
        {/* Dot Indicators */}
        <StepIndicator
          total={ONBOARDING_SCREENS.length}
          current={activeIndex}
          variant="dots"
        />

        {/* Swipe hint on first screen only */}
        {activeIndex === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-white/30 text-xs flex items-center gap-1"
          >
            <span>ปัดเพื่อดูต่อ</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </motion.p>
        )}
      </div>
    </div>
  );
}
