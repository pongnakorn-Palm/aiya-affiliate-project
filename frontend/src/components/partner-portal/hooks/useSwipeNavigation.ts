import { useState, useCallback } from "react";
import { triggerHaptic } from "../../../utils/haptic";

export type TabType = "dashboard" | "history" | "profile";

const TAB_ORDER: TabType[] = ["dashboard", "history", "profile"];

export function useSwipeNavigation(initialTab: TabType = "dashboard") {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const navigateTo = useCallback(
    (tab: TabType) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
        triggerHaptic("light");
      }
    },
    [activeTab]
  );

  const navigateByIndex = useCallback(
    (newIndex: number) => {
      if (newIndex >= 0 && newIndex < TAB_ORDER.length) {
        const newTab = TAB_ORDER[newIndex];
        if (newTab !== activeTab) {
          setActiveTab(newTab);
          triggerHaptic("light");
        }
      }
    },
    [activeTab]
  );

  const activeIndex = TAB_ORDER.indexOf(activeTab);

  return {
    activeTab,
    activeIndex,
    navigateTo,
    navigateByIndex,
    totalTabs: TAB_ORDER.length,
  };
}
