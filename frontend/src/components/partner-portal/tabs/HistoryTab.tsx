import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { formatCommission, maskName } from "../../../utils/formatting";
import type { Referral } from "../hooks/useReferralData";
import PullToRefresh from "../../ui/PullToRefresh";
import { useLanguage } from "../../../contexts/LanguageContext";

interface HistoryTabProps {
  referrals: Referral[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

type FilterType = "all" | "pending" | "approved" | "rejected";

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Skeleton Card Component
function SkeletonCard() {
  return (
    <div className="bg-[#1A1D21] rounded-2xl p-4 animate-pulse border border-white/5 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-xl bg-white/10"></div>
        <div className="flex-1">
          <div className="h-4 w-28 bg-white/10 rounded-lg mb-2"></div>
          <div className="h-3 w-40 bg-white/5 rounded-lg"></div>
        </div>
        <div className="text-right">
          <div className="h-5 w-20 bg-white/10 rounded-lg mb-2"></div>
          <div className="h-4 w-16 bg-white/5 rounded-lg ml-auto"></div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-8"
      >
        <motion.div
          className="relative w-24 h-24 mx-auto mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <div className="absolute inset-0 rounded-full bg-[#1A1D21]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="material-symbols-outlined text-5xl text-gray-500"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              inbox
            </motion.span>
          </div>
        </motion.div>

        <h3 className="text-white text-lg font-semibold mb-2">
          {t("history.empty")}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          {t("history.emptyDesc")}
          <br />
          {t("history.emptyDesc2")}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <span className="material-symbols-outlined text-sm">swipe_down</span>
          <span>{t("history.pullToRefresh")}</span>
        </div>
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
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: "all", label: t("history.all") },
    { id: "pending", label: t("history.pending"), count: referrals.filter(r => r.commissionStatus === "pending").length },
    { id: "approved", label: t("history.approved") },
    { id: "rejected", label: t("history.rejected") },
  ];

  const filteredReferrals = useMemo(() => {
    if (activeFilter === "all") return referrals;
    if (activeFilter === "approved") {
      return referrals.filter(r => r.commissionStatus === "approved" || r.commissionStatus === "paid");
    }
    return referrals.filter(r => r.commissionStatus === activeFilter);
  }, [referrals, activeFilter]);

  // Group referrals by date
  const groupedReferrals = useMemo(() => {
    const groups: { [key: string]: Referral[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredReferrals.forEach((referral) => {
      const date = new Date(referral.createdAt);
      date.setHours(0, 0, 0, 0);

      let key: string;
      if (date.getTime() === today.getTime()) {
        key = t("history.today");
      } else if (date.getTime() === yesterday.getTime()) {
        key = t("history.yesterday");
      } else {
        const locale = language === "en" ? "en-US" : "th-TH";
        key = date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(referral);
    });

    return groups;
  }, [filteredReferrals, t, language]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "approved":
        return {
          label: t("status.approved"),
          bgColor: "bg-green-500/20",
          textColor: "text-green-400",
          borderColor: "border-green-500/30",
          icon: "check",
        };
      case "rejected":
        return {
          label: t("status.rejected"),
          bgColor: "bg-red-500/20",
          textColor: "text-red-400",
          borderColor: "border-red-500/30",
          icon: "close",
        };
      default:
        return {
          label: t("status.pending"),
          bgColor: "bg-orange-500/20",
          textColor: "text-orange-400",
          borderColor: "border-orange-500/30",
          icon: "more_horiz",
        };
    }
  };

  const getAvatarColor = (status: string) => {
    switch (status) {
      case "paid":
      case "approved":
        return "from-green-500/40 to-cyan-500/40";
      case "rejected":
        return "from-red-500/40 to-orange-500/40";
      default:
        return "from-purple-500/40 to-cyan-500/40";
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case "paid":
      case "approved":
        return "border-l-green-500";
      case "rejected":
        return "border-l-red-500";
      default:
        return "border-l-orange-500";
    }
  };

  return (
    <PullToRefresh onRefresh={onRefresh} isRefreshing={isRefreshing}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col min-h-[calc(100vh-120px)] bg-[#0F1216] font-sans"
      >
        {/* Header */}
        <div className="px-5 pt-10 pb-4">
          <div className="mb-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{t("history.title")}</p>
            <h2 className="text-2xl font-bold text-white">{t("history.records")}</h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
                    : "bg-[#1A1D21] text-gray-300 border border-white/5"
                }`}
              >
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === filter.id ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 flex-1">
          {isLoading ? (
            <div className="space-y-3 pb-8">
              {[1, 2, 3, 4, 5].map((i) => (
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
            <div className="flex-1 flex items-center justify-center py-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                </div>
                <p className="text-red-400 font-semibold mb-2">{t("common.error")}</p>
                <p className="text-gray-500 text-sm">{t("history.pullToRetry")}</p>
              </motion.div>
            </div>
          ) : filteredReferrals.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6 pb-8"
            >
              {Object.entries(groupedReferrals).map(([date, items]) => (
                <div key={date}>
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-3">
                    {date}
                  </p>
                  <div className="space-y-3">
                    {items.map((referral) => {
                      const statusBadge = getStatusBadge(referral.commissionStatus);
                      const time = new Date(referral.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <motion.div
                          key={referral.id}
                          variants={fadeInUp}
                          className={`bg-[#1A1D21] rounded-2xl p-4 border border-white/5 border-l-4 shadow-xl ${getBorderColor(referral.commissionStatus)}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`size-12 rounded-xl bg-gradient-to-br ${getAvatarColor(referral.commissionStatus)} flex items-center justify-center`}>
                              <span className="material-symbols-outlined text-white text-xl">
                                {referral.commissionStatus === "pending" ? "person" : "group"}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-base truncate">
                                {maskName(`${referral.firstName} ${referral.lastName}`)}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {time} • {referral.packageType}
                              </p>
                            </div>

                            {/* Amount & Status */}
                            <div className="text-right flex-shrink-0">
                              <p className={`font-bold text-base ${
                                referral.commissionStatus === "approved" || referral.commissionStatus === "paid"
                                  ? "text-green-400"
                                  : referral.commissionStatus === "rejected"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}>
                                + ฿{formatCommission(referral.commissionAmount)}
                              </p>
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge.bgColor} ${statusBadge.textColor} border ${statusBadge.borderColor}`}>
                                <span className="material-symbols-outlined text-[10px]">{statusBadge.icon}</span>
                                {statusBadge.label}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <EmptyState t={t} />
          )}
        </div>
      </motion.div>
    </PullToRefresh>
  );
}
