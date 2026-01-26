import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLiff } from "../contexts/LiffContext";
import DashboardSkeleton from "./DashboardSkeleton";
import SEOHead from "./SEOHead";

// Haptic Feedback Helper
const triggerHaptic = (style: "light" | "medium" | "heavy" = "light") => {
  if ("vibrate" in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[style]);
  }
};

interface DashboardData {
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

export default function PartnerPortal() {
  const { isLoggedIn, profile, login, isReady, liffObject, isInClient } =
    useLiff();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "history" | "profile"
  >("dashboard");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);

  // Bank form states
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [passbookImage, setPassbookImage] = useState<File | null>(null);
  const [passbookPreview, setPassbookPreview] = useState<string | null>(null);
  const [saveButtonState, setSaveButtonState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Original bank data (for detecting changes)
  const [originalBankData, setOriginalBankData] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);

  // Custom dropdown state
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'new_referral' | 'commission_approved' | 'commission_paid' | 'welcome';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setShowBankDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate notifications from referrals data
  useEffect(() => {
    if (referrals.length > 0) {
      const lastSeenTime = localStorage.getItem('notifications_last_seen');
      const lastSeen = lastSeenTime ? new Date(lastSeenTime) : new Date(0);

      const newNotifications = referrals.slice(0, 10).map((referral) => {
        const createdAt = new Date(referral.createdAt);
        const isNew = createdAt > lastSeen;

        let type: 'new_referral' | 'commission_approved' | 'commission_paid' = 'new_referral';
        let title = 'มีผู้ใช้รหัสแนะนำใหม่';
        let message = `${referral.firstName} ${referral.lastName} ใช้รหัสของคุณลงทะเบียน`;

        if (referral.commissionStatus === 'paid') {
          type = 'commission_paid';
          title = 'ค่าคอมมิชชั่นถูกจ่ายแล้ว';
          message = `฿${(referral.commissionAmount / 100).toFixed(2)} จาก ${referral.firstName}`;
        } else if (referral.commissionStatus === 'approved') {
          type = 'commission_approved';
          title = 'ค่าคอมมิชชั่นได้รับการอนุมัติ';
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
    }
  }, [referrals]);

  // Mark all notifications as read
  const markAllNotificationsRead = () => {
    localStorage.setItem('notifications_last_seen', new Date().toISOString());
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Thai Bank List with Official Logos
  const BANKS = [
    {
      id: "kbank",
      abbr: "KBANK",
      name: "กสิกรไทย",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KBANK.png",
      color: "#138f2d",
    },
    {
      id: "scb",
      abbr: "SCB",
      name: "ไทยพาณิชย์",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/SCB.png",
      color: "#4e2e7f",
    },
    {
      id: "ktb",
      abbr: "KTB",
      name: "กรุงไทย",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KTB.png",
      color: "#1ba5e1",
    },
    {
      id: "bbl",
      abbr: "BBL",
      name: "กรุงเทพ",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BBL.png",
      color: "#1e4598",
    },
    {
      id: "ttb",
      abbr: "TTB",
      name: "ทหารไทยธนชาต",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TTB.png",
      color: "#0056ff",
    },
    {
      id: "bay",
      abbr: "BAY",
      name: "กรุงศรีอยุธยา",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BAY.png",
      color: "#fec43b",
    },
    {
      id: "gsb",
      abbr: "GSB",
      name: "ออมสิน",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/GSB.png",
      color: "#eb198d",
    },
    {
      id: "tisco",
      abbr: "TISCO",
      name: "ทิสโก้",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TISCO.png",
      color: "#123f6d",
    },
    {
      id: "kkp",
      abbr: "KKP",
      name: "เกียรตินาคินภัทร",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KKP.png",
      color: "#694d8b",
    },
    {
      id: "cimb",
      abbr: "CIMB",
      name: "ซีไอเอ็มบีไทย",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/CIMB.png",
      color: "#7e2f36",
    },
    {
      id: "uob",
      abbr: "UOB",
      name: "ยูโอบี",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/UOB.png",
      color: "#0b3979",
    },
    {
      id: "lhb",
      abbr: "LH BANK",
      name: "แลนด์ แอนด์ เฮ้าส์",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/LHB.png",
      color: "#6d6e71",
    },
    {
      id: "baac",
      abbr: "BAAC",
      name: "ธ.ก.ส.",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BAAC.png",
      color: "#4b9b1d",
    },
    {
      id: "ghb",
      abbr: "GHB",
      name: "อาคารสงเคราะห์",
      logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/GHB.png",
      color: "#f57d23",
    },
  ];

  // Get selected bank details
  const selectedBankData = BANKS.find((bank) => bank.id === selectedBank);

  // Format account number as xxx-x-xxxxx-x
  const formatAccountNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Apply Thai bank account format: xxx-x-xxxxx-x
    let formatted = "";
    if (digits.length > 0) {
      formatted = digits.substring(0, 3);
      if (digits.length > 3) {
        formatted += "-" + digits.substring(3, 4);
      }
      if (digits.length > 4) {
        formatted += "-" + digits.substring(4, 9);
      }
      if (digits.length > 9) {
        formatted += "-" + digits.substring(9, 10);
      }
    }
    return formatted;
  };

  // Handle account number input with auto-formatting
  const handleAccountNumberChange = (value: string) => {
    const formatted = formatAccountNumber(value);
    setAccountNumber(formatted);
  };

  // Handle paste from clipboard
  const handlePasteAccountNumber = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const formatted = formatAccountNumber(text);
      setAccountNumber(formatted);
      triggerHaptic("light");
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  // Check if form has changes
  const hasFormChanges = () => {
    if (!originalBankData) return true; // No original data = first save

    // Compare digits only for account number (since it's formatted with dashes)
    const currentAccountDigits = accountNumber.replace(/\D/g, "");

    const hasFieldChanges =
      selectedBank !== originalBankData.bankName ||
      currentAccountDigits !== originalBankData.accountNumber ||
      accountName !== originalBankData.accountName;

    const hasImageChange = passbookImage !== null; // New image selected

    return hasFieldChanges || hasImageChange;
  };

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
          `${apiUrl}/api/affiliate/dashboard/${profile.userId}`,
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
        setError(err.message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsLoading(false);
      }
    };

    if (isReady) {
      fetchDashboardData();
    }
  }, [isLoggedIn, profile?.userId, isReady]);

  // Fetch referral history function
  const handleFetchReferrals = async () => {
    if (!isLoggedIn || !profile?.userId) {
      return;
    }

    setIsLoadingReferrals(true);
    setReferralsError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/affiliate/referrals/${profile.userId}`,
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
        err.message || "ไม่สามารถโหลดประวัติได้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // Fetch referral history when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      handleFetchReferrals();
    }
  }, [activeTab, isLoggedIn, profile?.userId]);

  // Populate bank form when dashboard data loads
  useEffect(() => {
    if (dashboardData?.affiliate) {
      // Normalize bank name to lowercase for consistency (handles both old uppercase and new lowercase formats)
      const bankName = (dashboardData.affiliate.bankName || "").toLowerCase();
      const accountNum = dashboardData.affiliate.bankAccountNumber || "";
      const accountN = dashboardData.affiliate.bankAccountName || "";

      setSelectedBank(bankName);
      // Format account number when loading from database
      setAccountNumber(formatAccountNumber(accountNum));
      setAccountName(accountN);
      setPassbookPreview(dashboardData.affiliate.bankPassbookUrl || null);

      // Store original data for comparison (using digits only for account number)
      setOriginalBankData({
        bankName,
        accountNumber: accountNum.replace(/\D/g, ""),
        accountName: accountN,
      });
    }
  }, [dashboardData]);

  // Refresh dashboard data
  const refreshStats = async () => {
    if (!isLoggedIn || !profile?.userId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/affiliate/dashboard/${profile.userId}`,
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

  // Handle passbook image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    // Validate file size (max 2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      alert("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    setPassbookImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPassbookPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save bank profile
  const handleSaveBankProfile = async () => {
    if (!profile?.userId) return;

    // Validate required fields
    if (!selectedBank || !accountNumber || !accountName) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      triggerHaptic("medium");
      return;
    }

    // Validate account number (strip dashes for validation)
    const digitsOnly = accountNumber.replace(/\D/g, "");
    if (!/^\d{10,12}$/.test(digitsOnly)) {
      alert("เลขที่บัญชีต้องเป็นตัวเลข 10-12 หลัก");
      triggerHaptic("medium");
      return;
    }

    setSaveButtonState("loading");
    triggerHaptic("light");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const formData = new FormData();
      formData.append("bankName", selectedBank);
      formData.append("accountNumber", digitsOnly);
      formData.append("accountName", accountName);
      if (passbookImage) {
        formData.append("passbookImage", passbookImage);
      }

      const response = await fetch(
        `${apiUrl}/api/affiliate/profile/${profile.userId}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      if (data.success) {
        setSaveButtonState("success");
        triggerHaptic("heavy");

        // Refresh dashboard data to get updated bank info
        await refreshStats();

        // Clear the file input
        setPassbookImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Update original data to reflect saved state (disables save button)
        setOriginalBankData({
          bankName: selectedBank,
          accountNumber: digitsOnly,
          accountName,
        });

        // Revert button to idle after 3 seconds
        setTimeout(() => {
          setSaveButtonState("idle");
        }, 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      console.error("Profile save error:", err);
      alert(err.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      setSaveButtonState("idle");
      triggerHaptic("medium");
    }
  };

  // Pull-to-Refresh Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0 && activeTab === "dashboard") {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0 && !isRefreshing && activeTab === "dashboard") {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartY.current);

      if (distance > 0 && distance < 100) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      triggerHaptic("medium");
      setPullDistance(0);
      await refreshStats();
      triggerHaptic("light");
    } else {
      setPullDistance(0);
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

  // Format commission (stored in cents, convert to baht)
  const formatCommission = (cents: number) => {
    return (cents / 100).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format relative time (e.g., "2 ชั่วโมงที่แล้ว")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
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
      <div
        ref={containerRef}
        className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-aiya-navy via-[#0a1628] to-aiya-navy text-white overflow-x-hidden pb-24 font-sans overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${Math.min(pullDistance * 0.5, 50)}px)`,
          transition: pullDistance === 0 ? "transform 0.3s ease" : "none",
        }}
      >
        {/* Pull-to-Refresh Indicator */}
        {pullDistance > 0 && activeTab === "dashboard" && (
          <div className="absolute top-2 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="rounded-full bg-white/10 p-2 backdrop-blur-xl border border-white/20">
              <span
                className={`material-symbols-outlined text-white ${isRefreshing ? "animate-spin" : ""}`}
                style={{
                  fontSize: "20px",
                  transform: `rotate(${pullDistance * 3}deg)`,
                  transition: "transform 0.1s ease",
                }}
              >
                refresh
              </span>
            </div>
          </div>
        )}

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
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                triggerHaptic("light");
                setShowNotifications(!showNotifications);
                if (!showNotifications && referrals.length === 0) {
                  handleFetchReferrals();
                }
              }}
              className={`relative flex items-center justify-center size-11 rounded-full transition-all duration-200 border active:scale-95 ${
                showNotifications
                  ? 'bg-white/15 border-white/20 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <span
                className="material-symbols-outlined text-white transition-transform duration-200"
                style={{
                  fontSize: "22px",
                  fontVariationSettings: showNotifications ? "'FILL' 1" : "'FILL' 0",
                  transform: showNotifications ? 'rotate(-15deg)' : 'rotate(0deg)'
                }}
              >
                notifications
              </span>
              {/* Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg shadow-red-500/50">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div
                className="absolute top-14 right-0 w-80 bg-[#0a1628]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-[100]"
                style={{
                  animation: 'popoverIn 0.2s ease-out'
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-lg">notifications</span>
                    <h3 className="text-white font-semibold text-sm">การแจ้งเตือน</h3>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        markAllNotificationsRead();
                        setNotifications([]);
                        triggerHaptic("light");
                      }}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">delete_sweep</span>
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto max-h-72 scrollbar-hide">
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-all duration-200 hover:bg-white/5 cursor-pointer ${
                          !notification.read ? 'bg-blue-500/5' : ''
                        } ${index !== notifications.length - 1 ? 'border-b border-white/5' : ''}`}
                        onClick={() => {
                          // Mark individual notification as read
                          setNotifications(prev => prev.map(n =>
                            n.id === notification.id ? { ...n, read: true } : n
                          ));
                          triggerHaptic("light");
                        }}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 size-9 rounded-xl flex items-center justify-center ${
                          notification.type === 'commission_paid'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : notification.type === 'commission_approved'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          <span className="material-symbols-outlined text-base">
                            {notification.type === 'commission_paid'
                              ? 'payments'
                              : notification.type === 'commission_approved'
                              ? 'verified'
                              : 'person_add'}
                          </span>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{notification.message}</p>
                          <p className="text-[10px] text-slate-600 mt-1">
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="size-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 animate-pulse"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-slate-600">
                          notifications_off
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium">ไม่มีการแจ้งเตือนใหม่</p>
                      <p className="text-slate-600 text-xs mt-1">เมื่อมีกิจกรรมจะแสดงที่นี่</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setShowNotifications(false);
                        triggerHaptic("light");
                      }}
                      className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors py-1"
                    >
                      ดูประวัติทั้งหมด →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && displayData && (
          <div className="tab-content-enter">
            {/* Hero Card - Total Commission */}
            <div className="px-5 mt-2 mb-2 stagger-item">
              <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-aiya-purple via-[#5C499D] to-[#7B68EE] shadow-[0_12px_40px_rgba(58,35,181,0.35)]">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="relative p-7 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="text-white/90 text-base font-medium tracking-wide">
                      รายได้สะสม
                    </p>
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <span className="material-symbols-outlined text-white text-sm">
                        trending_up
                      </span>
                      <span className="text-white text-xs font-bold">
                        ใช้งานอยู่
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h1 className="text-white text-[2.75rem] font-extrabold tracking-tight leading-none drop-shadow-lg">
                      ฿ {formatCommission(displayData.stats.totalCommission)}
                    </h1>
                    <p className="text-white/80 text-sm font-medium mt-2">
                      อัปเดตเมื่อ {lastUpdated ? "เมื่อสักครู่" : "เร็วๆ นี้"}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((displayData.stats.totalCommission / 2000000) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-white ml-4 whitespace-nowrap">
                      เป้าหมาย: ฿ 20k
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Total Referrals, Pending & Paid */}
            <div className="flex flex-wrap gap-5 p-5 stagger-item">
              <div className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-blue-500/20 shadow-sm hover:border-blue-500/40 transition-colors">
                <div className="size-11 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">
                    ผู้ใช้โค้ด
                  </p>
                  <p className="text-white tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
                    {displayData.stats.totalRegistrations} คน
                  </p>
                </div>
              </div>
              <div className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-purple-500/20 shadow-sm hover:border-purple-500/40 transition-colors">
                <div className="size-11 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <span className="material-symbols-outlined">pending</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">
                    รอตรวจสอบ
                  </p>
                  <p className="text-purple-400 tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
                    ฿{formatCommission(displayData.stats.pendingCommission)}
                  </p>
                </div>
              </div>
              <div className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-emerald-500/20 shadow-sm hover:border-emerald-500/40 transition-colors">
                <div className="size-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">
                    จ่ายแล้ว
                  </p>
                  <p className="text-emerald-400 tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
                    ฿{formatCommission(paidCommission)}
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Code Section - Coupon Style */}
            <div className="px-5 pb-8 stagger-item">
              <div className="relative group">
                {/* Coupon Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/30 transition-all duration-300 hover:shadow-purple-500/40 hover:-translate-y-1 hover:scale-[1.01]">
                  {/* Top Section - Gradient Background */}
                  <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-aiya-purple px-6 pt-8 pb-12 text-center relative overflow-hidden">
                    {/* Animated background shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

                    {/* Decorative sparkles with animation */}
                    <div className="absolute top-4 left-6 text-yellow-300/70 text-lg animate-[twinkle_2s_ease-in-out_infinite]">✦</div>
                    <div className="absolute top-8 right-8 text-white/40 text-sm animate-[twinkle_2.5s_ease-in-out_infinite_0.5s]">✧</div>
                    <div className="absolute bottom-6 left-10 text-blue-200/50 text-xs animate-[twinkle_3s_ease-in-out_infinite_1s]">✦</div>

                    {/* Icon with pulse effect */}
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white/30 hover:shadow-xl group-hover:animate-[bounce_1s_ease-in-out]">
                      <span
                        className="material-symbols-outlined text-white text-3xl transition-transform duration-300 group-hover:scale-110"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        redeem
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold text-lg mb-1 transition-all duration-300 group-hover:tracking-wider">
                      รหัสแนะนำพิเศษ
                    </h3>
                    <p className="text-white/70 text-sm transition-all duration-300 group-hover:text-white/90">
                      แชร์รหัสนี้ให้เพื่อนเพื่อรับค่าคอมมิชชั่น
                    </p>
                  </div>

                  {/* Coupon Cutouts with shadow */}
                  <div className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-[#0a1628] rounded-full shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)]"></div>
                  <div className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-[#0a1628] rounded-full shadow-[inset_-2px_0_4px_rgba(0,0,0,0.3)]"></div>

                  {/* Bottom Section - Code Area */}
                  <div className="bg-gradient-to-br from-purple-600 via-aiya-purple to-purple-900 px-6 pt-8 pb-6 relative overflow-hidden">
                    {/* Dashed separator line */}
                    <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-white/20"></div>

                    {/* Decorative sparkles with animation */}
                    <div className="absolute top-4 left-8 text-yellow-300/60 text-sm animate-[twinkle_2s_ease-in-out_infinite_0.3s]">✨</div>
                    <div className="absolute top-6 right-6 text-pink-300/50 text-xs animate-[twinkle_2.5s_ease-in-out_infinite_0.7s]">✦</div>
                    <div className="absolute bottom-12 left-6 text-blue-300/40 text-xs animate-[twinkle_3s_ease-in-out_infinite_1.2s]">✧</div>
                    <div className="absolute bottom-8 right-10 text-yellow-200/50 text-sm animate-[float_3s_ease-in-out_infinite]">⭐</div>

                    {/* Coupon Code Label */}
                    <p className="text-purple-200/80 text-sm font-medium text-center mb-3 tracking-wide uppercase">
                      Affiliate Code
                    </p>

                    {/* Code Display with glow effect */}
                    <div className="text-center mb-6 relative">
                      <span className="text-white font-black text-4xl tracking-[0.15em] font-mono drop-shadow-lg transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover:tracking-[0.2em]">
                        {displayData.affiliate.affiliateCode}
                      </span>
                    </div>

                    {/* Copy Button with enhanced effects */}
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        copyToClipboard(displayData.affiliate.affiliateCode);
                      }}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-[0.96] ${
                        copied
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-[1.02]"
                          : "bg-white text-purple-700 shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 hover:scale-[1.02] hover:-translate-y-0.5"
                      }`}
                    >
                      <span className={`inline-flex items-center gap-2 transition-all duration-300 ${copied ? 'animate-[popIn_0.3s_ease-out]' : ''}`}>
                        {copied ? (
                          <>
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                            คัดลอกแล้ว!
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xl">content_copy</span>
                            คัดลอกรหัส
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LINE Share Button */}
            <div className="px-5 pb-8 stagger-item">
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  shareToLine();
                }}
                disabled={isSharing}
                className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl py-5 bg-[#06C755] transition-all duration-300 text-white shadow-xl shadow-green-900/40 active:scale-[0.97] ${
                  isSharing
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#05b34c] hover:shadow-2xl hover:shadow-green-500/50 hover:-translate-y-1 hover:scale-[1.02]"
                }`}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

                <div className="relative flex items-center justify-center gap-3">
                  <svg
                    className="w-7 h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  <span className="text-xl font-bold transition-all duration-300 group-hover:tracking-wide">
                    {isSharing ? "กำลังแชร์..." : "แชร์ให้เพื่อนใน LINE"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="px-5 mt-4 flex flex-col min-h-[calc(100vh-200px)] tab-content-enter">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                ประวัติการทำรายการ
              </h2>
              <button
                onClick={() => {
                  handleFetchReferrals();
                  triggerHaptic("light");
                }}
                disabled={isLoadingReferrals}
                className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className={`material-symbols-outlined text-white text-xl ${isLoadingReferrals ? "animate-spin" : ""}`}
                >
                  refresh
                </span>
              </button>
            </div>

            {isLoadingReferrals ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4"></div>
                  <p className="text-white/70 text-sm">กำลังโหลด...</p>
                </div>
              </div>
            ) : referralsError ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
                  <p className="text-red-400 font-semibold">เกิดข้อผิดพลาด</p>
                </div>
              </div>
            ) : referrals.length > 0 ? (
              <div className="space-y-4">
                {referrals.map((referral) => {
                  const statusInfo =
                    referral.commissionStatus === "paid"
                      ? {
                          label: "จ่ายแล้ว",
                          color: "text-emerald-400",
                          icon: "check_circle",
                        }
                      : referral.commissionStatus === "approved"
                        ? {
                            label: "อนุมัติแล้ว",
                            color: "text-blue-400",
                            icon: "verified",
                          }
                        : {
                            label: "รอตรวจสอบ",
                            color: "text-yellow-400",
                            icon: "pending",
                          };

                  return (
                    <div
                      key={referral.id}
                      className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-5 hover:border-aiya-purple/40 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-semibold text-base">
                            {referral.firstName} {referral.lastName}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {new Date(referral.createdAt).toLocaleDateString(
                              "th-TH",
                              {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              },
                            )}
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
                        <span className="text-slate-500 text-xs">
                          {referral.email}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-7xl text-slate-600 mb-4 block">
                    receipt_long
                  </span>
                  <p className="text-slate-400">ยังไม่มีประวัติ</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && displayData && (
          <div className="px-5 mt-4 tab-content-enter">
            <h2 className="text-2xl font-bold text-white mb-6">ข้อมูลบัญชี</h2>

            {/* User Info Section */}
            <div className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                ข้อมูลผู้ใช้
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    value={displayData.affiliate.name}
                    readOnly
                    className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={displayData.affiliate.email}
                    readOnly
                    className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={displayData.affiliate.phone}
                    readOnly
                    className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Section */}
            <div className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  ข้อมูลบัญชีธนาคาร
                </h3>
                {displayData.affiliate.bankName &&
                  displayData.affiliate.bankAccountNumber && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">
                        check_circle
                      </span>
                      <span className="text-emerald-400 text-xs font-semibold">
                        บันทึกแล้ว
                      </span>
                    </div>
                  )}
              </div>

              <div className="space-y-5">
                {/* Bank Selector - Custom Dropdown */}
                <div ref={bankDropdownRef}>
                  <label className="text-sm text-slate-400 mb-2 block">
                    เลือกธนาคาร
                  </label>
                  <div className="relative">
                    {/* Dropdown Trigger Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowBankDropdown(!showBankDropdown);
                        triggerHaptic("light");
                      }}
                      className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3.5 text-left flex items-center gap-3 hover:border-blue-400/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                    >
                      {selectedBankData ? (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0">
                            <img
                              src={selectedBankData.logo}
                              alt={selectedBankData.abbr}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-white font-medium">
                              {selectedBankData.abbr}
                            </span>
                            <span className="text-slate-400 ml-2">
                              - {selectedBankData.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-slate-400">
                            account_balance
                          </span>
                          <span className="text-slate-400">เลือกธนาคาร</span>
                        </>
                      )}
                      <span
                        className={`material-symbols-outlined text-slate-400 ml-auto transition-transform ${showBankDropdown ? "rotate-180" : ""}`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {showBankDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                        {BANKS.map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => {
                              setSelectedBank(bank.id);
                              setShowBankDropdown(false);
                              triggerHaptic("medium");
                            }}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors ${
                              selectedBank === bank.id ? "bg-blue-500/20" : ""
                            } ${bank.id === BANKS[0].id ? "rounded-t-xl" : ""} ${bank.id === BANKS[BANKS.length - 1].id ? "rounded-b-xl" : ""}`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0">
                              <img
                                src={bank.logo}
                                alt={bank.abbr}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-white font-medium">
                                {bank.abbr}
                              </span>
                              <span className="text-slate-400 ml-2 text-sm">
                                - {bank.name}
                              </span>
                            </div>
                            {selectedBank === bank.id && (
                              <span className="material-symbols-outlined text-blue-400 text-lg">
                                check
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Number */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    เลขที่บัญชี
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) =>
                        handleAccountNumberChange(e.target.value)
                      }
                      placeholder="xxx-x-xxxxx-x"
                      maxLength={13}
                      className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 pr-24 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50 transition-colors font-mono tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={handlePasteAccountNumber}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        content_paste
                      </span>
                      <span>วาง</span>
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    ชื่อบัญชี
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล ตรงตามบัญชีธนาคาร"
                    className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>

                {/* Passbook Image Upload */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    รูปภาพหน้าสมุดบัญชี
                  </label>

                  {passbookPreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-aiya-navy/50 border border-aiya-purple/20">
                      <img
                        src={passbookPreview}
                        alt="Passbook preview"
                        className="w-full h-full object-cover"
                      />
                      {/* Minimal Change Button */}
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          triggerHaptic("light");
                        }}
                        className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-white text-lg">
                          edit
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-aiya-purple/30 bg-aiya-navy/30 hover:border-blue-400/50 hover:bg-aiya-navy/50 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.99]"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-400 text-3xl">
                          upload_file
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium mb-1">
                          อัปโหลดรูปหน้าสมุดบัญชี
                        </p>
                        <p className="text-slate-400 text-xs">
                          รองรับ JPG, PNG (ไม่เกิน 2MB)
                        </p>
                      </div>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveBankProfile}
                disabled={
                  !hasFormChanges() ||
                  saveButtonState === "loading" ||
                  saveButtonState === "success"
                }
                className={`w-full mt-6 font-bold py-3 px-6 rounded-full transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                  saveButtonState === "success"
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                    : saveButtonState === "loading"
                      ? "bg-gradient-to-r from-aiya-purple to-[#5C499D] cursor-wait shadow-aiya-purple/20"
                      : "bg-gradient-to-r from-aiya-purple to-[#5C499D] hover:from-aiya-purple/80 hover:to-[#5C499D]/80 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-aiya-purple/20"
                } text-white`}
              >
                {saveButtonState === "loading" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : saveButtonState === "success" ? (
                  <>
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    <span>บันทึกเรียบร้อย!</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>บันทึกข้อมูลบัญชีธนาคาร</span>
                  </>
                )}
              </button>
            </div>

            {/* Additional Info */}
            <div className="bg-white/5 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-400 text-xl mt-0.5">
                  info
                </span>
                <div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ข้อมูลบัญชีธนาคารจะใช้สำหรับการโอนเงินค่าคอมมิชชั่นให้กับคุณ
                    กรุณาตรวจสอบความถูกต้องก่อนบันทึก
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
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
          @keyframes popIn {
            0% {
              transform: scale(0.8);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes popoverIn {
            0% {
              opacity: 0;
              transform: scale(0.95) translateY(-8px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
            }
            50% {
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
            }
          }
        `}</style>
      </div>

      {/* Bottom Navigation - Using Portal to bypass PageTransition transform stacking context */}
      {createPortal(
        <div
          className="fixed bottom-0 left-0 z-50 w-full bg-aiya-navy/95 backdrop-blur-xl border-t border-aiya-purple/20 shadow-[0_-4px_20px_rgba(58,35,181,0.15)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex h-16 items-center justify-around px-2">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab("dashboard");
              }}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95 ${
                activeTab === "dashboard"
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    activeTab === "dashboard" ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                dashboard
              </span>
              <span
                className={`text-[10px] ${activeTab === "dashboard" ? "font-bold" : "font-medium"}`}
              >
                หน้าหลัก
              </span>
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab("history");
              }}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95 ${
                activeTab === "history"
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    activeTab === "history" ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                bar_chart
              </span>
              <span
                className={`text-[10px] ${activeTab === "history" ? "font-bold" : "font-medium"}`}
              >
                ประวัติ
              </span>
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab("profile");
              }}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95 ${
                activeTab === "profile"
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    activeTab === "profile" ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                person
              </span>
              <span
                className={`text-[10px] ${activeTab === "profile" ? "font-bold" : "font-medium"}`}
              >
                บัญชี
              </span>
            </button>
          </div>
          <div className="h-4 w-full"></div>
        </div>,
        document.body
      )}
    </>
  );
}
