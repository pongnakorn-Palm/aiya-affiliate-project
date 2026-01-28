import { motion } from "framer-motion";
import BottomSheet from "../../ui/BottomSheet";
import { formatRelativeTime } from "../../../utils/formatting";
import { triggerHaptic } from "../../../utils/haptic";
import type { Notification } from "../hooks/useNotifications";
import { useLanguage } from "../../../contexts/LanguageContext";

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onViewHistory: () => void;
  onNavigate?: (tab: "dashboard" | "history" | "profile") => void;
}

export default function NotificationSheet({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onClearAll,
  onViewHistory,
  onNavigate,
}: NotificationSheetProps) {
  const { t } = useLanguage();

  const getIconConfig = (type: Notification["type"]) => {
    switch (type) {
      case "commission_paid":
        return {
          bg: "bg-green-500/20",
          color: "text-green-400",
          icon: "payments",
          navigateTo: "history" as const,
        };
      case "commission_approved":
        return {
          bg: "bg-yellow-500/20",
          color: "text-primary",
          icon: "verified",
          navigateTo: "history" as const,
        };
      default:
        return {
          bg: "bg-cyan-500/20",
          color: "text-cyan-400",
          icon: "person_add",
          navigateTo: "dashboard" as const,
        };
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    onMarkRead(notification.id);
    triggerHaptic("light");
    const iconConfig = getIconConfig(notification.type);
    if (onNavigate) {
      onNavigate(iconConfig.navigateTo);
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("notification.title")}>
      {/* Header Actions */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-b border-white/10 flex justify-end">
          <button
            onClick={() => {
              onClearAll();
              triggerHaptic("light");
            }}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">
              delete_sweep
            </span>
            {t("notification.clearAll")}
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="overflow-y-auto max-h-[60vh]">
        {notifications.length > 0 ? (
          notifications.map((notification, index) => {
            const iconConfig = getIconConfig(notification.type);

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-3 px-4 py-3 transition-all duration-200 hover:bg-white/5 active:bg-white/10 cursor-pointer ${
                  !notification.read ? "bg-yellow-500/5" : ""
                } ${index !== notifications.length - 1 ? "border-b border-white/5" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 size-9 rounded-xl flex items-center justify-center ${iconConfig.bg} ${iconConfig.color}`}
                >
                  <span className="material-symbols-outlined text-base">
                    {iconConfig.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold leading-tight ${!notification.read ? "text-white" : "text-gray-300"}`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1.5">
                    {formatRelativeTime(notification.timestamp)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="size-2 rounded-full bg-primary flex-shrink-0 mt-1.5 shadow-lg shadow-primary/30"></div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-20 rounded-full bg-aiya-dark flex items-center justify-center mb-4 border border-white/5">
              <span className="material-symbols-outlined text-4xl text-gray-600">
                notifications_off
              </span>
            </div>
            <p className="text-white text-base font-semibold mb-1">
              {t("notification.empty")}
            </p>
            <p className="text-gray-500 text-xs">
              {t("notification.emptyDesc")}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 bg-aiya-dark">
          <button
            onClick={() => {
              onViewHistory();
              onClose();
              triggerHaptic("light");
            }}
            className="w-full text-center text-sm text-primary hover:text-primary-light transition-colors py-1 font-semibold"
          >
            {t("notification.viewHistory")}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
