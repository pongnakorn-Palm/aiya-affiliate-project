import { useState, useEffect } from "react";

interface Referral {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  commissionAmount: number;
  commissionStatus: string;
  createdAt: string;
}

interface ReferralHistoryProps {
  lineUserId: string;
}

export default function ReferralHistory({ lineUserId }: ReferralHistoryProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(
          `${apiUrl}/api/affiliate/referrals/${lineUserId}`
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
        console.error("Referral history error:", err);
        setError(err.message || "ไม่สามารถโหลดประวัติได้");
      } finally {
        setIsLoading(false);
      }
    };

    if (lineUserId) {
      fetchReferrals();
    }
  }, [lineUserId]);

  // Format commission
  const formatCommission = (cents: number) => {
    return (cents / 100).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get package label
  const getPackageLabel = (packageType: string) => {
    const labels: Record<string, string> = {
      single: "Single Package",
      duo: "Duo Package",
    };
    return labels[packageType] || packageType;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[status] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "รอตรวจสอบ",
      approved: "อนุมัติแล้ว",
      rejected: "ไม่อนุมัติ",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-white/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          ยังไม่มีประวัติการแนะนำ
        </h3>
        <p className="text-white/60 text-sm">
          เริ่มแชร์ลิงก์ของคุณเพื่อรับค่าคอมมิชชั่น
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          📋 ประวัติการแนะนำ ({referrals.length})
        </h3>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/60 text-sm font-medium pb-3">
                ชื่อ
              </th>
              <th className="text-left text-white/60 text-sm font-medium pb-3">
                Package
              </th>
              <th className="text-right text-white/60 text-sm font-medium pb-3">
                ค่าคอมมิชชั่น
              </th>
              <th className="text-center text-white/60 text-sm font-medium pb-3">
                สถานะ
              </th>
              <th className="text-right text-white/60 text-sm font-medium pb-3">
                วันที่
              </th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr
                key={referral.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3">
                  <p className="text-white font-medium">
                    {referral.firstName} {referral.lastName}
                  </p>
                  <p className="text-white/50 text-xs">{referral.email}</p>
                </td>
                <td className="py-3">
                  <span className="text-white/80 text-sm">
                    {getPackageLabel(referral.packageType)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-green-400 font-bold">
                    ฿{formatCommission(referral.commissionAmount)}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex justify-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        referral.commissionStatus
                      )}`}
                    >
                      {getStatusLabel(referral.commissionStatus)}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right text-white/60 text-sm">
                  {formatDate(referral.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {referrals.map((referral) => (
          <div
            key={referral.id}
            className="bg-white/5 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-medium">
                  {referral.firstName} {referral.lastName}
                </p>
                <p className="text-white/50 text-xs">{referral.email}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  referral.commissionStatus
                )}`}
              >
                {getStatusLabel(referral.commissionStatus)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white/60 text-sm">
                {getPackageLabel(referral.packageType)}
              </span>
              <span className="text-green-400 font-bold">
                ฿{formatCommission(referral.commissionAmount)}
              </span>
            </div>
            <p className="text-white/40 text-xs">
              {formatDate(referral.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
