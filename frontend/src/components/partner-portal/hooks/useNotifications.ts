import { useState, useEffect, useCallback } from "react";
import type { Referral } from "./useReferralData";

export interface Notification {
  id: string;
  type: "new_referral" | "commission_approved" | "commission_paid" | "welcome";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications(referrals: Referral[]) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (referrals.length === 0) return;

    const lastSeenTime = localStorage.getItem("notifications_last_seen");
    const lastSeen = lastSeenTime ? new Date(lastSeenTime) : new Date(0);

    const newNotifications = referrals.slice(0, 10).map((referral) => {
      const createdAt = new Date(referral.createdAt);
      const isNew = createdAt > lastSeen;

      let type: Notification["type"] = "new_referral";
      let title = "มีผู้ใช้รหัสแนะนำใหม่";
      let message = `${referral.firstName} ${referral.lastName} ใช้รหัสของคุณลงทะเบียน`;

      if (referral.commissionStatus === "paid") {
        type = "commission_paid";
        title = "ค่าคอมมิชชั่นถูกจ่ายแล้ว";
        message = `฿${(referral.commissionAmount / 100).toFixed(2)} จาก ${referral.firstName}`;
      } else if (referral.commissionStatus === "approved") {
        type = "commission_approved";
        title = "ค่าคอมมิชชั่นได้รับการอนุมัติ";
        message = `฿${(referral.commissionAmount / 100).toFixed(2)} จาก ${referral.firstName} รอการจ่าย`;
      }

      return {
        id: `${referral.id}-${type}`,
        type,
        title,
        message,
        timestamp: createdAt,
        read: !isNew,
      };
    });

    setNotifications(newNotifications);
  }, [referrals]);

  const markAllRead = useCallback(() => {
    localStorage.setItem("notifications_last_seen", new Date().toISOString());
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    markAllRead();
    setNotifications([]);
  }, [markAllRead]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    setNotifications,
    markAllRead,
    markRead,
    clearAll,
    unreadCount,
  };
}
