import { useState, useEffect } from "react";
import { useLiff } from "../contexts/LiffContext";

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
  const { isLoggedIn, profile, login, isReady } = useLiff();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Show loading spinner while LIFF is initializing
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-aiya-purple mb-4"></div>
          <p className="text-white/70 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17] px-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-aiya-purple"
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
            Partner Portal
          </h2>
          <p className="text-white/70 mb-6">
            กรุณาเข้าสู่ระบบด้วย LINE เพื่อเข้าถึง Dashboard ของคุณ
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34b] text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17] px-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
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
            className="btn-gradient w-full"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-aiya-purple mb-4"></div>
          <p className="text-white/70 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Format commission (stored in cents, convert to baht)
  const formatCommission = (cents: number) => {
    return (cents / 100).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Generate referral link
  const referralLink = dashboardData
    ? `https://aiya-bootcamp.vercel.app/tickets?referral=${dashboardData.affiliate.affiliateCode}`
    : "";

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17]">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Partner Portal
          </h1>
          <p className="text-white/60">ยินดีต้อนรับกลับมา 👋</p>
        </div>

        {/* Profile Card */}
        {profile && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-4">
              {profile.pictureUrl ? (
                <img
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  className="w-16 h-16 rounded-full border-2 border-aiya-purple"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-aiya-purple to-aiya-navy flex items-center justify-center text-white text-2xl font-bold">
                  {profile.displayName?.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {profile.displayName}
                </h2>
                {dashboardData && (
                  <p className="text-white/60 text-sm">
                    {dashboardData.affiliate.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Affiliate Code Card */}
        {dashboardData && (
          <div className="glass-card p-6 mb-6 text-center bg-gradient-to-br from-aiya-purple/20 to-aiya-navy/20">
            <p className="text-white/60 text-sm mb-2">รหัส Affiliate ของคุณ</p>
            <div className="relative inline-block">
              <p className="text-4xl md:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-widest">
                {dashboardData.affiliate.affiliateCode}
              </p>
            </div>
            <button
              onClick={() =>
                copyToClipboard(dashboardData.affiliate.affiliateCode)
              }
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              {copied ? (
                <>
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  คัดลอกรหัส
                </>
              )}
            </button>
          </div>
        )}

        {/* Stats Grid */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Total Registrations */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white/60 text-sm">จำนวนผู้สมัคร</p>
                  <p className="text-3xl font-bold text-white">
                    {dashboardData.stats.totalRegistrations}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Commission */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white/60 text-sm">ค่าคอมมิชชั่นทั้งหมด</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                    ฿{formatCommission(dashboardData.stats.totalCommission)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referral Link Card */}
        {dashboardData && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">
              🔗 ลิงก์แนะนำของคุณ
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-aiya-purple"
              />
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="px-4 py-3 bg-aiya-purple hover:bg-aiya-purple/80 text-white rounded-lg transition-colors duration-200"
              >
                {copied ? (
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-white/50 text-xs mt-2">
              แชร์ลิงก์นี้เพื่อรับค่าคอมมิชชั่น
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-8">
          © 2025 MeGenius Company Limited. All rights reserved
        </p>
      </div>
    </div>
  );
}
