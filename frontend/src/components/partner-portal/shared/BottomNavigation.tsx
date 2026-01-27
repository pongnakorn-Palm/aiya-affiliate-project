import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { triggerHaptic } from "../../../utils/haptic";
import type { TabType } from "../hooks/useSwipeNavigation";
import { useLanguage } from "../../../contexts/LanguageContext";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const { t } = useLanguage();

  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: "dashboard", icon: "dashboard", label: t("nav.dashboard") },
    { id: "history", icon: "bar_chart", label: t("nav.history") },
    { id: "profile", icon: "person", label: t("nav.profile") },
  ];
  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="h-[72px] rounded-2xl bg-[#1A1D21]/95 backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        <div className="flex h-full items-center justify-around px-4">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic("light");
                onTabChange(tab.id);
              }}
              className="relative flex flex-col items-center justify-center gap-1.5 px-6 py-2"
            >
              {/* Icon container with glow effect for active */}
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-2xl transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                  style={{
                    fontVariationSettings:
                      activeTab === tab.id ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {tab.icon}
                </span>
                {/* Glow effect for active icon */}
                {activeTab === tab.id && (
                  <div className="absolute inset-0 blur-lg bg-yellow-400/30 -z-10"></div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  activeTab === tab.id ? "text-yellow-400" : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>

              {/* Active dot indicator */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-yellow-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
