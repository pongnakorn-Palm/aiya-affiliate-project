import { useState, useEffect } from "react";
import { useLiff } from "../contexts/LiffContext";
import DashboardSkeleton from "./DashboardSkeleton";
import SEOHead from "./SEOHead";

interface DashboardData {
  affiliate: {
    name: string;
    email: string;
    phone: string;
    affiliateCode: string;
    createdAt: string;
  };
  stats: {
    totalRegistrations: number;
    totalCommission: number;
    approvedCommission: number;
    pendingCommission: number;
  };
}

export default function PartnerPortal() {
  const { isLoggedIn, profile, login, isReady, liffObject, isInClient } = useLiff();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);

  // Fetch dashboard data when logged in
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isLoggedIn || !profile?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(
          `${apiUrl}/api/affiliate/dashboard/${profile.userId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch dashboard data");
        }

        if (data.success) {
          setDashboardData(data.data);
          setLastUpdated(new Date());
          setError(null);
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(
          err.message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isReady) {
      fetchDashboardData();
    }
  }, [isLoggedIn, profile?.userId, isReady]);

  // Fetch referral history when switching to history tab
  useEffect(() => {
    const fetchReferrals = async () => {
      if (activeTab !== 'history' || !isLoggedIn || !profile?.userId) {
        return;
      }

      setIsLoadingReferrals(true);
      setReferralsError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(
          `${apiUrl}/api/affiliate/referrals/${profile.userId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch referrals");
        }

        if (data.success) {
          setReferrals(data.data.referrals);
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        console.error("Referrals fetch error:", err);
        setReferralsError(
          err.message || "ไม่สามารถโหลดประวัติได้ กรุณาลองใหม่อีกครั้ง"
        );
      } finally {
        setIsLoadingReferrals(false);
      }
    };

    fetchReferrals();
  }, [activeTab, isLoggedIn, profile?.userId]);

  // Refresh dashboard data
  const refreshStats = async () => {
    if (!isLoggedIn || !profile?.userId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/affiliate/dashboard/${profile.userId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to refresh data");
      }

      if (data.success) {
        setDashboardData(data.data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err: any) {
      console.error("Refresh error:", err);
      setError("ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Share to LINE
  const shareToLine = async () => {
    if (!liffObject || !dashboardData || isSharing) return;

    setIsSharing(true);

    try {
      // Check if running in LINE client
      if (!isInClient) {
        alert("กรุณาเปิดในแอป LINE เพื่อใช้ฟีเจอร์แชร์");
        setIsSharing(false);
        return;
      }

      // Check if shareTargetPicker is available
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
    } catch (error: any) {
      console.error("Share error:", error);

      if (error.message && error.message.includes("CANCEL")) {
        console.log("Share cancelled by user");
      } else {
        alert("ไม่สามารถแชร์ได้ กรุณาลองอีกครั้ง");
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Copy referral link
  const copyReferralLink = () => {
    if (!dashboardData) return;
    const referralLink = `https://aiya-bootcamp.vercel.app/tickets?referral=${dashboardData.affiliate.affiliateCode}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Format commission (stored in cents, convert to baht)
  const formatCommission = (cents: number) => {
    return (cents / 100).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Show loading spinner while LIFF is initializing
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020c17]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-white/70 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020c17] px-4">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-primary"
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
          <h2 className="text-2xl font-bold text-white mb-3">
            สถิติของฉัน
          </h2>
          <p className="text-white/70 mb-6">
            กรุณาเข้าสู่ระบบด้วย LINE เพื่อดูยอดและสถิติของคุณ
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-line-green hover:bg-[#05b34b] text-white font-medium px-6 py-3 rounded-full transition-colors duration-200"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
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
      <div className="min-h-screen flex items-center justify-center bg-[#020c17] px-4">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
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

  // Use real data from API
  const displayData = dashboardData;
  const paidCommission = displayData
    ? displayData.stats.totalCommission - displayData.stats.pendingCommission
    : 0;

  return (
    <>
      <SEOHead
        title={`${displayData?.affiliate.name || "สถิติของฉัน"} - AIYA Affiliate`}
        description={`ดูสถิติและค่าคอมมิชชั่นของคุณ | จำนวนผู้สมัคร: ${displayData?.stats.totalRegistrations || 0} คน | รายได้: ${displayData ? formatCommission(displayData.stats.totalCommission) : 0} บาท`}
      />
      <div className="relative flex min-h-screen w-full flex-col bg-[#020c17] text-white overflow-x-hidden pb-24 font-sans">

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
                <div className="size-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.displayName?.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 size-3.5 rounded-full bg-green-500 border-2 border-[#020c17]"></div>
            </div>
            <div>
              <p className="text-white/60 text-sm font-medium leading-tight mb-0.5">ยินดีต้อนรับ,</p>
              <p className="text-white text-xl font-bold leading-tight">
                {profile?.displayName || "Partner"}
              </p>
            </div>
          </div>
          <button
            onClick={refreshStats}
            disabled={isRefreshing}
            className="flex items-center justify-center size-11 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>
              {isRefreshing ? 'refresh' : 'notifications'}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && displayData && (
          <>
            {/* Hero Card - Total Commission */}
            <div className="px-5 mt-2 mb-2">
              <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_12px_40px_rgba(245,158,11,0.25)]">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="relative p-7 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="text-white/90 text-base font-medium tracking-wide">รายได้สะสม</p>
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <span className="material-symbols-outlined text-white text-sm">trending_up</span>
                      <span className="text-white text-xs font-bold">ใช้งานอยู่</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h1 className="text-white text-[2.75rem] font-extrabold tracking-tight leading-none">
                      ฿ {formatCommission(displayData.stats.totalCommission)}
                    </h1>
                    <p className="text-white/80 text-sm font-medium mt-2">
                      อัปเดตเมื่อ {lastUpdated ? 'เมื่อสักครู่' : 'เร็วๆ นี้'}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/90 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((displayData.stats.totalCommission / 2000000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-white ml-4 whitespace-nowrap">เป้าหมาย: ฿ 20k</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Pending & Paid */}
            <div className="flex flex-wrap gap-5 p-5">
              <div className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-[#1e293b]/60 backdrop-blur-md border border-white/5 shadow-sm">
                <div className="size-11 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined">pending</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">รอตรวจสอบ</p>
                  <p className="text-white tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
                    ฿{formatCommission(displayData.stats.pendingCommission)}
                  </p>
                </div>
              </div>
              <div className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-[#1e293b]/60 backdrop-blur-md border border-white/5 shadow-sm">
                <div className="size-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">จ่ายแล้ว</p>
                  <p className="text-white tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
                    ฿{formatCommission(paidCommission)}
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Code Section */}
            <div className="px-5 pb-6">
              <label className="text-sm text-slate-400 font-medium ml-1 mb-3 block">รหัสแนะนำของคุณ</label>
              <div className="flex items-center justify-between bg-[#1e293b] rounded-2xl border border-white/10 p-2 pl-6 shadow-sm">
                <span className="text-primary font-bold text-xl tracking-widest font-mono">
                  {displayData.affiliate.affiliateCode}
                </span>
                <button
                  onClick={() => copyToClipboard(displayData.affiliate.affiliateCode)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 px-5 pb-8 flex-grow justify-end">
              <button
                onClick={shareToLine}
                disabled={isSharing}
                className={`relative w-full cursor-pointer overflow-hidden rounded-full h-14 bg-line-green hover:bg-[#05b34c] transition-colors text-white shadow-lg shadow-green-900/30 group ${
                  isSharing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-center gap-3 px-5 h-full w-full">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  <span className="text-lg font-bold tracking-wide">
                    {isSharing ? 'กำลังแชร์...' : 'แชร์บอกเพื่อน'}
                  </span>
                </div>
              </button>
              <button
                onClick={copyReferralLink}
                className="w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                <div className="flex items-center justify-center gap-3 px-5">
                  <span className="material-symbols-outlined text-2xl">
                    {copiedLink ? 'check' : 'link'}
                  </span>
                  <span className="text-lg font-semibold">
                    {copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                  </span>
                </div>
              </button>
            </div>
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="px-5 mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">ประวัติการทำรายการ</h2>
              <button
                onClick={() => {
                  setReferrals([]);
                  setActiveTab('dashboard');
                  setTimeout(() => setActiveTab('history'), 100);
                }}
                className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-white text-xl">refresh</span>
              </button>
            </div>

            {isLoadingReferrals ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-white/70 text-sm">กำลังโหลดประวัติ...</p>
              </div>
            ) : referralsError ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
                <p className="text-red-400 font-semibold mb-2">เกิดข้อผิดพลาด</p>
                <p className="text-slate-400 text-sm">{referralsError}</p>
              </div>
            ) : referrals.length > 0 ? (
              <div className="space-y-4">
                {referrals.map((referral) => {
                  const statusInfo =
                    referral.commissionStatus === 'paid'
                      ? { label: 'จ่ายแล้ว', color: 'text-emerald-400', icon: 'check_circle' }
                      : referral.commissionStatus === 'approved'
                      ? { label: 'อนุมัติแล้ว', color: 'text-blue-400', icon: 'verified' }
                      : { label: 'รอตรวจสอบ', color: 'text-yellow-400', icon: 'pending' };

                  return (
                    <div
                      key={referral.id}
                      className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-semibold text-base">
                            {referral.firstName} {referral.lastName}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {new Date(referral.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">
                            +฿ {formatCommission(referral.commissionAmount)}
                          </p>
                          <div className={`flex items-center gap-1 justify-end text-sm font-medium ${statusInfo.color}`}>
                            <span className="material-symbols-outlined text-sm">{statusInfo.icon}</span>
                            <span>{statusInfo.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">📦 {referral.packageType}</span>
                        <span className="text-slate-500 text-xs">{referral.email}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-8xl text-slate-600 mb-4 block">receipt_long_off</span>
                <h3 className="text-white text-xl font-bold mb-2">ยังไม่มีประวัติการแนะนำ</h3>
                <p className="text-slate-400 text-sm mb-1">เริ่มแชร์รหัสของคุณเพื่อรับค่าคอมมิชชั่น!</p>
                <p className="text-slate-500 text-xs">รหัสของคุณ: <span className="text-primary font-bold">{displayData?.affiliate.affiliateCode}</span></p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && displayData && (
          <div className="px-5 mt-4">
            <h2 className="text-2xl font-bold text-white mb-6">ข้อมูลบัญชี</h2>

            {/* User Info Section */}
            <div className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">ข้อมูลผู้ใช้</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">ชื่อ</label>
                  <input
                    type="text"
                    value={displayData.affiliate.name}
                    readOnly
                    className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">อีเมล</label>
                  <input
                    type="email"
                    value={displayData.affiliate.email}
                    readOnly
                    className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={displayData.affiliate.phone}
                    readOnly
                    className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Section */}
            <div className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">ข้อมูลบัญชีธนาคาร</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">ธนาคาร</label>
                  <select className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors">
                    <option value="">เลือกธนาคาร</option>
                    <option value="scb">ไทยพาณิชย์ (SCB)</option>
                    <option value="kbank">กสิกรไทย (KBANK)</option>
                    <option value="bbl">กรุงเทพ (BBL)</option>
                    <option value="ktb">กรุงไทย (KTB)</option>
                    <option value="tmb">ทหารไทยธนชาต (TTB)</option>
                    <option value="bay">กรุงศรีอยุธยา (BAY)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">เลขที่บัญชี</label>
                  <input
                    type="text"
                    placeholder="กรอกเลขที่บัญชี 10-12 หลัก"
                    className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">ชื่อบัญชี</label>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล ตรงตามบัญชีธนาคาร"
                    className="w-full bg-[#0f1729] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              <button className="w-full mt-6 bg-primary hover:bg-primary/80 text-white font-bold py-3 px-6 rounded-full transition-colors">
                บันทึกข้อมูลบัญชีธนาคาร
              </button>
            </div>

            {/* Additional Info */}
            <div className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-400 text-xl mt-0.5">info</span>
                <div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ข้อมูลบัญชีธนาคารจะใช้สำหรับการโอนเงินค่าคอมมิชชั่นให้กับคุณ กรุณาตรวจสอบความถูกต้องก่อนบันทึก
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 z-50 w-full bg-[#020c17]/95 backdrop-blur-xl border-t border-white/5" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex h-16 items-center justify-around px-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                activeTab === 'dashboard' ? 'text-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: activeTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}
              >
                dashboard
              </span>
              <span className={`text-[10px] ${activeTab === 'dashboard' ? 'font-bold' : 'font-medium'}`}>หน้าหลัก</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                activeTab === 'history' ? 'text-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: activeTab === 'history' ? "'FILL' 1" : "'FILL' 0" }}
              >
                bar_chart
              </span>
              <span className={`text-[10px] ${activeTab === 'history' ? 'font-bold' : 'font-medium'}`}>ประวัติ</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                activeTab === 'profile' ? 'text-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
              >
                person
              </span>
              <span className={`text-[10px] ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>บัญชี</span>
            </button>
          </div>
          <div className="h-4 w-full"></div>
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </>
  );
}
