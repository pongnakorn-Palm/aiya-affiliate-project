import { useState, useEffect } from "react";
import { useLiff } from "../contexts/LiffContext";
import DashboardSkeleton from "./DashboardSkeleton";
import SEOHead from "./SEOHead";

// Hooks
import { useReferralData } from "./partner-portal/hooks/useReferralData";
import { useSwipeNavigation } from "./partner-portal/hooks/useSwipeNavigation";
import { useNotifications } from "./partner-portal/hooks/useNotifications";

// Tab Components
import DashboardTab from "./partner-portal/tabs/DashboardTab";
import HistoryTab from "./partner-portal/tabs/HistoryTab";
import ProfileTab from "./partner-portal/tabs/ProfileTab";

// Shared Components
import BottomNavigation from "./partner-portal/shared/BottomNavigation";
import NotificationSheet from "./partner-portal/shared/NotificationSheet";

// UI Components
import SwipeableView from "./ui/SwipeableView";

// Utils
import { formatCommission } from "../utils/formatting";
import { triggerHaptic } from "../utils/haptic";

export default function PartnerPortal() {
  const { isLoggedIn, profile, login, isReady, liffObject, isInClient } =
    useLiff();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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
        alert("กรุณาเปิดในแอป LINE เพื่อใช้ฟีเจอร์แชร์");
        setIsSharing(false);
        return;
      }

      if (!liffObject.isApiAvailable("shareTargetPicker")) {
        alert("ฟีเจอร์แชร์ไม่พร้อมใช้งาน กรุณาอัปเดต LINE เป็นเวอร์ชันล่าสุด");
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
        console.log("Shared successfully");
      }
    } catch (error: unknown) {
      console.error("Share error:", error);

      if (
        error instanceof Error &&
        error.message &&
        error.message.includes("CANCEL")
      ) {
        console.log("Share cancelled by user");
      } else {
        alert("ไม่สามารถแชร์ได้ กรุณาลองอีกครั้ง");
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Show loading spinner while LIFF is initializing
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aiya-navy via-[#0a1628] to-aiya-navy">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-white/70 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aiya-navy via-[#0a1628] to-aiya-navy px-4">
        <div className="bg-white/5 backdrop-blur-2xl border border-aiya-purple/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-aiya-purple/10">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">สถิติของฉัน</h2>
          <p className="text-white/70 mb-6">
            กรุณาเข้าสู่ระบบด้วย LINE เพื่อดูยอดและสถิติของคุณ
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-line-green hover:bg-[#05b34b] text-white font-medium px-6 py-3 rounded-full transition-colors duration-200"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aiya-navy via-[#0a1628] to-aiya-navy px-4">
        <div className="bg-white/5 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-red-500/10">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">เกิดข้อผิดพลาด</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-6 rounded-full transition-colors"
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

      <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-aiya-navy via-[#0a1628] to-aiya-navy text-white overflow-x-hidden pb-24 font-sans overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative size-14 overflow-hidden rounded-full border-2 border-white/20">
              {profile?.pictureUrl ? (
                <img
                  alt="Profile"
                  className="size-full object-cover"
                  src={profile.pictureUrl}
                />
              ) : (
                <div className="size-full bg-gradient-to-br from-aiya-purple to-[#7B68EE] flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.displayName?.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 size-3.5 rounded-full bg-green-500 border-2 border-aiya-navy"></div>
            </div>
            <div>
              <p className="text-white/60 text-sm font-medium leading-tight mb-0.5">
                ยินดีต้อนรับ,
              </p>
              <p className="text-white text-xl font-bold leading-tight">
                {profile?.displayName || "Partner"}
              </p>
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
            className={`relative flex items-center justify-center size-11 rounded-full transition-all duration-200 border active:scale-95 ${
              showNotifications
                ? "bg-white/15 border-white/20 shadow-lg shadow-purple-500/20"
                : "bg-white/5 border-white/5 hover:bg-white/10"
            }`}
          >
            <span
              className="material-symbols-outlined text-white transition-transform duration-200"
              style={{
                fontSize: "22px",
                fontVariationSettings: showNotifications
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              notifications
            </span>
            {/* Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg shadow-red-500/50">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Swipeable Tab Content */}
        <SwipeableView
          activeIndex={activeIndex}
          onIndexChange={navigateByIndex}
        >
          {displayData && (
            <DashboardTab
              data={displayData}
              lastUpdated={lastUpdated}
              onShare={shareToLine}
              isSharing={isSharing}
            />
          )}
          <HistoryTab
            referrals={referrals}
            isLoading={isLoadingReferrals}
            error={referralsError}
            onRefresh={refreshReferrals}
            isRefreshing={isRefreshingReferrals}
          />
          {displayData && (
            <ProfileTab
              affiliate={displayData.affiliate}
              userId={profile?.userId}
              onRefresh={refresh}
            />
          )}
        </SwipeableView>

        {/* CSS Animations */}
        <style>{`
          @keyframes twinkle {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-5px) rotate(10deg);
            }
          }
        `}</style>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={navigateTo} />

      {/* Notification Bottom Sheet */}
      <NotificationSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onClearAll={clearAll}
        onViewHistory={() => navigateTo("history")}
      />
    </>
  );
}
