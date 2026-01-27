import { motion } from "framer-motion";
import BottomSheet from "../../ui/BottomSheet";
import { formatRelativeTime } from "../../../utils/formatting";
import { triggerHaptic } from "../../../utils/haptic";
import type { Notification } from "../hooks/useNotifications";

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onViewHistory: () => void;
}

export default function NotificationSheet({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onClearAll,
  onViewHistory,
}: NotificationSheetProps) {
  const getIconConfig = (type: Notification["type"]) => {
    switch (type) {
      case "commission_paid":
        return {
          bg: "bg-emerald-500/20",
          color: "text-emerald-400",
          icon: "payments",
        };
      case "commission_approved":
        return {
          bg: "bg-purple-500/20",
          color: "text-purple-400",
          icon: "verified",
        };
      default:
        return {
          bg: "bg-blue-500/20",
          color: "text-blue-400",
          icon: "person_add",
        };
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="การแจ้งเตือน">
      {/* Header Actions */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-b border-white/10 flex justify-end">
          <button
            onClick={() => {
              onClearAll();
              triggerHaptic("light");
            }}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">
              delete_sweep
            </span>
            ล้างทั้งหมด
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
                className={`flex items-start gap-3 px-4 py-3 transition-all duration-200 hover:bg-white/5 cursor-pointer ${
                  !notification.read ? "bg-blue-500/5" : ""
                } ${index !== notifications.length - 1 ? "border-b border-white/5" : ""}`}
                onClick={() => {
                  onMarkRead(notification.id);
                  triggerHaptic("light");
                }}
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
                    className={`text-sm font-medium leading-tight ${!notification.read ? "text-white" : "text-slate-300"}`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {formatRelativeTime(notification.timestamp)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="size-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 animate-pulse"></div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-600">
                notifications_off
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              ไม่มีการแจ้งเตือนใหม่
            </p>
            <p className="text-slate-600 text-xs mt-1">
              เมื่อมีกิจกรรมจะแสดงที่นี่
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 bg-white/5">
          <button
            onClick={() => {
              onViewHistory();
              onClose();
              triggerHaptic("light");
            }}
            className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors py-1"
          >
            ดูประวัติทั้งหมด →
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
