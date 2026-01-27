import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { triggerHaptic } from "../../../utils/haptic";
import type { TabType } from "../hooks/useSwipeNavigation";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; icon: string; label: string }[] = [
  { id: "dashboard", icon: "dashboard", label: "หน้าหลัก" },
  { id: "history", icon: "bar_chart", label: "ประวัติ" },
  { id: "profile", icon: "person", label: "บัญชี" },
];

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return createPortal(
    <div
      className="fixed bottom-0 left-0 z-50 w-full"
      style={{ backgroundColor: "#070d1a" }}
    >
      <div className="bg-aiya-navy/95 backdrop-blur-xl border-t border-aiya-purple/20 shadow-[0_-4px_20px_rgba(58,35,181,0.15)]">
        <div className="flex h-16 items-center justify-around px-2 relative">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic("light");
                onTabChange(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                activeTab === tab.id
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {/* Active indicator */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-0.5 w-12 h-1 bg-blue-400 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    activeTab === tab.id ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[10px] ${activeTab === tab.id ? "font-bold" : "font-medium"}`}
              >
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
      {/* Safe area fill */}
      <div style={{ height: "env(safe-area-inset-bottom)" }}></div>
    </div>,
    document.body
  );
}
