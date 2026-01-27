import { useState, useEffect, useCallback } from "react";

export interface DashboardData {
  affiliate: {
    name: string;
    email: string;
    phone: string;
    affiliateCode: string;
    createdAt: string;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
    bankPassbookUrl: string | null;
  };
  stats: {
    totalRegistrations: number;
    totalCommission: number;
    approvedCommission: number;
    pendingCommission: number;
  };
}

export interface Referral {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  commissionAmount: number;
  commissionStatus: string;
  createdAt: string;
}

export function useReferralData(userId: string | undefined) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [isRefreshingReferrals, setIsRefreshingReferrals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralsError, setReferralsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/affiliate/dashboard/${userId}`
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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchReferrals = useCallback(async () => {
    if (!userId) return;

    setIsLoadingReferrals(true);
    setReferralsError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/affiliate/referrals/${userId}`
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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดประวัติได้ กรุณาลองใหม่อีกครั้ง";
      setReferralsError(errorMessage);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchDashboard();
    setIsRefreshing(false);
  }, [fetchDashboard, isRefreshing]);

  const refreshReferrals = useCallback(async () => {
    if (isRefreshingReferrals) return;
    setIsRefreshingReferrals(true);
    setReferralsError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/affiliate/referrals/${userId}`
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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดประวัติได้ กรุณาลองใหม่อีกครั้ง";
      setReferralsError(errorMessage);
    } finally {
      setIsRefreshingReferrals(false);
    }
  }, [userId, isRefreshingReferrals]);

  useEffect(() => {
    if (userId) {
      fetchDashboard();
    } else {
      setIsLoading(false);
    }
  }, [userId, fetchDashboard]);

  return {
    dashboardData,
    referrals,
    isLoading,
    isRefreshing,
    isLoadingReferrals,
    isRefreshingReferrals,
    error,
    referralsError,
    lastUpdated,
    refresh,
    fetchReferrals,
    refreshReferrals,
  };
}
