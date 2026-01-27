import { motion } from "framer-motion";
import { formatCommission } from "../../../utils/formatting";
import type { Referral } from "../hooks/useReferralData";
import PullToRefresh from "../../ui/PullToRefresh";

interface HistoryTabProps {
  referrals: Referral[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Skeleton Card Component
function SkeletonCard() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="h-5 w-32 bg-white/10 rounded-lg mb-2"></div>
          <div className="h-4 w-20 bg-white/5 rounded-lg"></div>
        </div>
        <div className="text-right">
          <div className="h-6 w-24 bg-white/10 rounded-lg mb-2"></div>
          <div className="h-4 w-16 bg-white/5 rounded-lg ml-auto"></div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <div className="h-4 w-24 bg-white/5 rounded-lg"></div>
        <div className="h-3 w-32 bg-white/5 rounded-lg"></div>
      </div>
    </div>
  );
}

// Empty State Component with Animation
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-8"
      >
        {/* Animated Illustration */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Background circle */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-aiya-purple/20 to-blue-500/10"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="material-symbols-outlined text-6xl text-slate-500"
              style={{ fontVariationSettings: "'FILL' 0" }}
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              inbox
            </motion.span>
          </div>

          {/* Floating particles */}
          <motion.div
            className="absolute top-2 right-4 w-2 h-2 rounded-full bg-purple-400/40"
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-4 left-2 w-1.5 h-1.5 rounded-full bg-blue-400/40"
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </motion.div>

        {/* Text */}
        <motion.h3
          className="text-white text-lg font-semibold mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          ยังไม่มีประวัติการทำรายการ
        </motion.h3>
        <motion.p
          className="text-slate-400 text-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          เมื่อมีคนใช้รหัสแนะนำของคุณ
          <br />
          รายการจะแสดงที่นี่
        </motion.p>

        {/* Hint */}
        <motion.div
          className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="material-symbols-outlined text-sm">
            swipe_down
          </span>
          <span>ดึงลงเพื่อรีเฟรช</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function HistoryTab({
  referrals,
  isLoading,
  error,
  onRefresh,
  isRefreshing = false,
}: HistoryTabProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "paid":
        return {
          label: "จ่ายแล้ว",
          color: "text-emerald-400",
          icon: "check_circle",
        };
      case "approved":
        return {
          label: "อนุมัติแล้ว",
          color: "text-blue-400",
          icon: "verified",
        };
      default:
        return {
          label: "รอตรวจสอบ",
          color: "text-yellow-400",
          icon: "pending",
        };
    }
  };

  return (
    <PullToRefresh onRefresh={onRefresh} isRefreshing={isRefreshing}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 mt-4 flex flex-col min-h-[calc(100vh-200px)]"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">ประวัติการทำรายการ</h2>
          {/* Refreshing indicator */}
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-blue-400 text-sm"
            >
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span>กำลังอัปเดต...</span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          // Skeleton Loading
          <div className="space-y-4 pb-8">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <SkeletonCard />
              </motion.div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-red-400">
                  error
                </span>
              </div>
              <p className="text-red-400 font-semibold mb-2">เกิดข้อผิดพลาด</p>
              <p className="text-slate-500 text-sm">ดึงลงเพื่อลองใหม่</p>
            </motion.div>
          </div>
        ) : referrals.length > 0 ? (
          // Referral List
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4 pb-8"
          >
            {referrals.map((referral) => {
              const statusInfo = getStatusInfo(referral.commissionStatus);

              return (
                <motion.div
                  key={referral.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-5 hover:border-aiya-purple/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-semibold text-base">
                        {referral.firstName} {referral.lastName}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(referral.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        +฿ {formatCommission(referral.commissionAmount)}
                      </p>
                      <div
                        className={`flex items-center gap-1 justify-end text-sm font-medium ${statusInfo.color}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {statusInfo.icon}
                        </span>
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">
                      📦 {referral.packageType}
                    </span>
                    <span className="text-slate-500 text-xs">{referral.email}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          // Empty State
          <EmptyState />
        )}
      </motion.div>
    </PullToRefresh>
  );
}
