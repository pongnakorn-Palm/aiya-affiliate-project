import { useState, useEffect, lazy, Suspense } from "react";
import { useLiff } from "../contexts/LiffContext";
import { useLanguage } from "../contexts/LanguageContext";
import DashboardSkeleton from "./DashboardSkeleton";
import SEOHead from "./SEOHead";

// Hooks
import { useReferralData } from "./partner-portal/hooks/useReferralData";
import { useSwipeNavigation } from "./partner-portal/hooks/useSwipeNavigation";
import { useNotifications } from "./partner-portal/hooks/useNotifications";
import { useToast } from "../hooks/useToast";

// Tab Components (Lazy Loaded)
const DashboardTab = lazy(() => import("./partner-portal/tabs/DashboardTab"));
const HistoryTab = lazy(() => import("./partner-portal/tabs/HistoryTab"));
const ProfileTab = lazy(() => import("./partner-portal/tabs/ProfileTab"));

// Shared Components
import BottomNavigation from "./partner-portal/shared/BottomNavigation";
import NotificationSheet from "./partner-portal/shared/NotificationSheet";

// UI Components
import SwipeableView from "./ui/SwipeableView";

// Utils
import { formatCommission } from "../utils/formatting";
import { triggerHaptic } from "../utils/haptic";

const TabLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] px-5">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400/50 mb-3"></div>
      <p className="text-white/50 text-sm">กำลังโหลด...</p>
    </div>
  </div>
);

export default function PartnerPortal() {
  const { isLoggedIn, profile, login, isReady, liffObject, isInClient } =
    useLiff();
  const { t } = useLanguage();
  const toast = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);

  // Custom hooks
  const {
    dashboardData,
    referrals,
    isLoading,
    isLoadingReferrals,
    isRefreshingReferrals,
    error,
    referralsError,
    lastUpdated,
    refresh,
    fetchReferrals,
    refreshReferrals,
  } = useReferralData(profile?.userId);

  const { activeTab, activeIndex, navigateTo, navigateByIndex } =
    useSwipeNavigation("dashboard");

  const { notifications, markRead, clearAll, unreadCount } =
    useNotifications(referrals);

  // Fetch referrals when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      fetchReferrals();
    }
  }, [activeTab, fetchReferrals]);

  // Share to LINE function
  const shareToLine = async () => {
    if (!liffObject || !dashboardData || isSharing) return;

    setIsSharing(true);

    try {
      if (!isInClient) {
        toast.warning("กรุณาเปิดในแอป LINE เพื่อใช้ฟีเจอร์แชร์");
        setIsSharing(false);
        return;
      }

      if (!liffObject.isApiAvailable("shareTargetPicker")) {
        toast.warning("ฟีเจอร์แชร์ไม่พร้อมใช้งาน กรุณาอัปเดต LINE เป็นเวอร์ชันล่าสุด");
        setIsSharing(false);
        return;
      }

      const referralLink = `https://aiya-bootcamp.vercel.app/tickets?referral=${dashboardData.affiliate.affiliateCode}`;
      const shareMessage = `🎉 มาร่วม AI EMPIRE Bootcamp กับเราสิ!\n\n✨ เรียนรู้ AI ให้เป็นมืออาชีพ\n💰 รับส่วนลดพิเศษเมื่อใช้รหัสของฉัน\n\n🔑 รหัส: ${dashboardData.affiliate.affiliateCode}\n🔗 ลิงก์: ${referralLink}\n\n#AIBootcamp #AIYA #AIEmpire`;

      const result = await liffObject.shareTargetPicker([
        {
          type: "text",
          text: shareMessage,
        },
      ]);

      if (result) {
        toast.success("แชร์สำเร็จ!");
      }
    } catch (error: unknown) {
      console.error("Share error:", error);

      if (
        error instanceof Error &&
        error.message &&
        error.message.includes("CANCEL")
      ) {
        // Share cancelled by user - no action needed
      } else {
        toast.error("ไม่สามารถแชร์ได้ กรุณาลองอีกครั้ง");
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Show loading spinner while LIFF is initializing
  if (!isReady) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-aiya-navy">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mb-4"></div>
          <p className="text-white/70 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F1216] px-4">
        {/* Premium Gold Ambient */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 bg-background-card backdrop-blur-2xl border border-aiya-lavender/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-400 text-4xl">person</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">สถิติของฉัน</h2>
          <p className="text-gray-400 mb-6">
            กรุณาเข้าสู่ระบบด้วย LINE เพื่อดูยอดและสถิติของคุณ
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-line-green hover:bg-[#05b34b] text-white font-bold px-6 py-4 rounded-2xl transition-colors duration-200 shadow-lg shadow-line-green/30"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F1216] px-4">
        <div className="bg-background-card backdrop-blur-2xl border border-error/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-2xl transition-colors shadow-lg shadow-yellow-400/30"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Show loading state with skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const displayData = dashboardData;

  return (
    <>
      <SEOHead
        title={`${displayData?.affiliate.name || "สถิติของฉัน"} - AIYA Affiliate`}
        description={`ดูสถิติและค่าคอมมิชชั่นของคุณ | จำนวนผู้สมัคร: ${displayData?.stats.totalRegistrations || 0} คน | รายได้: ${displayData ? formatCommission(displayData.stats.totalCommission) : 0} บาท`}
      />

      <div className="relative min-h-[100dvh] w-full flex flex-col bg-aiya-navy text-white overflow-x-hidden font-sans">
        {/* AIYA Brand Ambient Lighting */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-aiya-purple/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-aiya-lavender/8 via-transparent to-transparent blur-3xl pointer-events-none"></div>

        {/* Header */}
        {activeTab === "dashboard" && (
          <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-12 overflow-hidden rounded-full border-2 border-white/10 shadow-xl">
                  {profile?.pictureUrl ? (
                    <img
                      alt="Profile"
                      className="size-full object-cover"
                      src={profile.pictureUrl}
                    />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-yellow-500/50 to-amber-600/50 flex items-center justify-center text-white text-lg font-bold">
                      {profile?.displayName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-success border-2 border-aiya-navy"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 font-medium tracking-wider uppercase">{t("header.welcome")}</span>
                <span className="text-base font-bold text-white">{profile?.displayName || t("header.partner")}</span>
              </div>
            </div>

            {/* Notification Button */}
            <button
              onClick={() => {
                triggerHaptic("light");
                setShowNotifications(true);
                if (referrals.length === 0) {
                  fetchReferrals();
                }
              }}
              className="relative flex items-center justify-center size-11 rounded-xl bg-background-card border border-aiya-lavender/10 text-white hover:bg-aiya-purple/20 transition-colors active:scale-95 shadow-lg"
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{
                  fontVariationSettings: showNotifications ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="relative z-10 flex-1 flex flex-col pb-40 no-scrollbar">
          <SwipeableView
            activeIndex={activeIndex}
            onIndexChange={navigateByIndex}
          >
            <Suspense fallback={<TabLoadingFallback />}>
              {displayData && (
                <DashboardTab
                  data={displayData}
                  lastUpdated={lastUpdated}
                  onShare={shareToLine}
                  isSharing={isSharing}
                  referrals={referrals}
                />
              )}
            </Suspense>
            <Suspense fallback={<TabLoadingFallback />}>
              <HistoryTab
                referrals={referrals}
                isLoading={isLoadingReferrals}
                error={referralsError}
                onRefresh={refreshReferrals}
                isRefreshing={isRefreshingReferrals}
              />
            </Suspense>
            <Suspense fallback={<TabLoadingFallback />}>
              {displayData && (
                <ProfileTab
                  affiliate={displayData.affiliate}
                  userId={profile?.userId}
                  onRefresh={refresh}
                  profile={profile ? {
                    displayName: profile.displayName || "",
                    pictureUrl: profile.pictureUrl
                  } : undefined}
                  onBankFormChange={setIsBankFormOpen}
                />
              )}
            </Suspense>
          </SwipeableView>
        </div>
      </div>

      {/* Bottom Navigation - Floating Glass Dock */}
      {!isBankFormOpen && <BottomNavigation activeTab={activeTab} onTabChange={navigateTo} />}

      {/* Notification Bottom Sheet */}
      <NotificationSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onClearAll={clearAll}
        onViewHistory={() => navigateTo("history")}
        onNavigate={navigateTo}
      />
    </>
  );
}
