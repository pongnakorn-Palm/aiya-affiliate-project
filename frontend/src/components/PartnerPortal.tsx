import { useState, useEffect, useRef } from "react";
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

  // Bank form states
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [passbookImage, setPassbookImage] = useState<File | null>(null);
  const [passbookPreview, setPassbookPreview] = useState<string | null>(null);
  const [saveButtonState, setSaveButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Original bank data (for detecting changes)
  const [originalBankData, setOriginalBankData] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);

  // Bank modal states
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  // Passbook image modal state
  const [showPassbookModal, setShowPassbookModal] = useState(false);

  // Thai Bank List with Official Logos
  const BANKS = [
    { id: 'kbank', name: 'กสิกรไทย', fullName: 'ธนาคารกสิกรไทย', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KBANK.png', color: '#138f2d' },
    { id: 'scb', name: 'ไทยพาณิชย์', fullName: 'ธนาคารไทยพาณิชย์', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/SCB.png', color: '#4e2e7f' },
    { id: 'ktb', name: 'กรุงไทย', fullName: 'ธนาคารกรุงไทย', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KTB.png', color: '#1ba5e1' },
    { id: 'bbl', name: 'กรุงเทพ', fullName: 'ธนาคารกรุงเทพ', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BBL.png', color: '#1e4598' },
    { id: 'ttb', name: 'ทหารไทยธนชาต', fullName: 'ธนาคารทหารไทยธนชาต', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TTB.png', color: '#0056ff' },
    { id: 'bay', name: 'กรุงศรี', fullName: 'ธนาคารกรุงศรีอยุธยา', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BAY.png', color: '#fec43b' },
    { id: 'gsb', name: 'ออมสิน', fullName: 'ธนาคารออมสิน', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/GSB.png', color: '#eb198d' },
    { id: 'tisco', name: 'ทิสโก้', fullName: 'ธนาคารทิสโก้', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TISCO.png', color: '#123f6d' },
    { id: 'kkp', name: 'เกียรตินาคินภัทร', fullName: 'ธนาคารเกียรตินาคินภัทร', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KKP.png', color: '#694d8b' },
    { id: 'cimb', name: 'ซีไอเอ็มบี', fullName: 'ธนาคารซีไอเอ็มบีไทย', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/CIMB.png', color: '#7e2f36' },
    { id: 'uob', name: 'ยูโอบี', fullName: 'ธนาคารยูโอบี', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/UOB.png', color: '#0b3979' },
    { id: 'lhb', name: 'แลนด์ แอนด์ เฮ้าส์', fullName: 'ธนาคารแลนด์ แอนด์ เฮ้าส์', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/LHB.png', color: '#6d6e71' },
    { id: 'baac', name: 'ธ.ก.ส.', fullName: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BAAC.png', color: '#4b9b1d' },
    { id: 'ghb', name: 'อาคารสงเคราะห์', fullName: 'ธนาคารอาคารสงเคราะห์', logo: 'https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/GHB.png', color: '#f57d23' },
  ];

  // Filter banks based on search query
  const filteredBanks = BANKS.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    bank.fullName.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    bank.id.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  // Get selected bank details
  const selectedBankData = BANKS.find(bank => bank.id === selectedBank);

  // Format account number as xxx-x-xxxxx-x
  const formatAccountNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Apply Thai bank account format: xxx-x-xxxxx-x
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 3);
      if (digits.length > 3) {
        formatted += '-' + digits.substring(3, 4);
      }
      if (digits.length > 4) {
        formatted += '-' + digits.substring(4, 9);
      }
      if (digits.length > 9) {
        formatted += '-' + digits.substring(9, 10);
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
      console.error('Failed to read clipboard:', err);
    }
  };

  // Check if form has changes
  const hasFormChanges = () => {
    if (!originalBankData) return true; // No original data = first save

    // Compare digits only for account number (since it's formatted with dashes)
    const currentAccountDigits = accountNumber.replace(/\D/g, '');

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

  // Fetch referral history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      handleFetchReferrals();
    }
  }, [activeTab, isLoggedIn, profile?.userId]);

  // Prevent body scroll when passbook modal is open
  useEffect(() => {
    if (showPassbookModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPassbookModal]);

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
        accountNumber: accountNum.replace(/\D/g, ''),
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

  // Handle passbook image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setProfileSaveMessage({ type: 'error', text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น' });
      return;
    }

    // Validate file size (max 2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      setProfileSaveMessage({ type: 'error', text: 'ขนาดไฟล์ต้องไม่เกิน 2MB' });
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

  // Remove passbook image
  const handleRemoveImage = () => {
    setPassbookImage(null);
    setPassbookPreview(dashboardData?.affiliate.bankPassbookUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Save bank profile
  const handleSaveBankProfile = async () => {
    if (!profile?.userId) return;

    // Validate required fields
    if (!selectedBank || !accountNumber || !accountName) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      triggerHaptic("medium");
      return;
    }

    // Validate account number (strip dashes for validation)
    const digitsOnly = accountNumber.replace(/\D/g, '');
    if (!/^\d{10,12}$/.test(digitsOnly)) {
      alert('เลขที่บัญชีต้องเป็นตัวเลข 10-12 หลัก');
      triggerHaptic("medium");
      return;
    }

    setSaveButtonState('loading');
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      if (data.success) {
        // Close any open modals
        setShowBankModal(false);

        setSaveButtonState('success');
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
          setSaveButtonState('idle');
        }, 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      console.error("Profile save error:", err);
      alert(err.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      setSaveButtonState('idle');
      triggerHaptic("medium");
    }
  };

  // Pull-to-Refresh Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0 && activeTab === 'dashboard') {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0 && !isRefreshing && activeTab === 'dashboard') {
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
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >

        {/* Bank Selection Modal */}
        {showBankModal && (
          <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center px-0 md:px-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => {
                setShowBankModal(false);
                setBankSearchQuery("");
                triggerHaptic("light");
              }}
            />

            {/* Modal Content */}
            <div className="relative w-full md:max-w-2xl bg-gradient-to-b from-aiya-navy/98 to-[#0A0F1E]/98 md:rounded-3xl rounded-t-3xl border-t-2 md:border-2 border-aiya-purple/30 shadow-2xl max-h-[85vh] md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-white">เลือกธนาคารของคุณ</h3>
                  <p className="text-sm text-slate-400 mt-1">เลือกจาก {BANKS.length} ธนาคาร</p>
                </div>
                <button
                  onClick={() => {
                    setShowBankModal(false);
                    setBankSearchQuery("");
                    triggerHaptic("light");
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-white">close</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 pt-4 pb-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    search
                  </span>
                  <input
                    type="text"
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อธนาคาร..."
                    className="w-full bg-aiya-navy/80 border border-aiya-purple/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                  {bankSearchQuery && (
                    <button
                      onClick={() => setBankSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-400">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bank Grid */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {filteredBanks.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSelectedBank(bank.id);
                          setShowBankModal(false);
                          setBankSearchQuery("");
                          triggerHaptic("medium");
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95 ${
                          selectedBank === bank.id
                            ? 'shadow-lg'
                            : 'border-white/10 bg-aiya-navy/30 hover:border-white/20 hover:bg-aiya-navy/50'
                        }`}
                        style={{
                          borderColor: selectedBank === bank.id ? bank.color : undefined,
                          backgroundColor: selectedBank === bank.id ? `${bank.color}15` : undefined,
                        }}
                      >
                        <div className="w-16 h-16 rounded-xl bg-white p-2.5 flex items-center justify-center mb-3 shadow-md">
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to colored circle with initials
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.style.backgroundColor = bank.color;
                                parent.style.padding = '0';
                                parent.innerHTML = `<span class="text-white text-sm font-bold">${bank.id.substring(0, 2).toUpperCase()}</span>`;
                              }
                            }}
                          />
                        </div>
                        <span className={`text-sm font-medium text-center leading-tight ${
                          selectedBank === bank.id ? 'text-white' : 'text-slate-300'
                        }`}>
                          {bank.name}
                        </span>
                        {selectedBank === bank.id && (
                          <div className="mt-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: bank.color }}>
                            <span className="material-symbols-outlined text-white text-sm">check</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-slate-500 text-3xl">search_off</span>
                    </div>
                    <p className="text-slate-400 font-medium">ไม่พบธนาคารที่ค้นหา</p>
                    <p className="text-slate-500 text-sm mt-1">ลองค้นหาด้วยชื่ออื่น</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Passbook Image Modal */}
        {showPassbookModal && passbookPreview && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            {/* Backdrop - Click to close */}
            <div
              className="fixed inset-0"
              onClick={() => {
                setShowPassbookModal(false);
                triggerHaptic("light");
              }}
            />

            {/* Modal Content - Always Centered */}
            <div className="relative max-h-[80vh] w-full max-w-lg animate-in zoom-in-95 fade-in duration-300">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPassbookModal(false);
                  triggerHaptic("light");
                }}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center transition-colors z-10"
              >
                <span className="material-symbols-outlined text-white text-xl">close</span>
              </button>

              {/* Image Container */}
              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={passbookPreview}
                  alt="Passbook"
                  className="object-contain w-full h-full rounded-lg"
                />

                {/* Action Button - Overlaid on Image */}
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowPassbookModal(false);
                    triggerHaptic("medium");
                  }}
                  className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2.5 shadow-xl transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  <span className="font-medium text-sm">เปลี่ยนรูป</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pull-to-Refresh Indicator */}
        {pullDistance > 0 && activeTab === 'dashboard' && (
          <div className="absolute top-2 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="rounded-full bg-white/10 p-2 backdrop-blur-xl border border-white/20">
              <span
                className={`material-symbols-outlined text-white ${isRefreshing ? 'animate-spin' : ''}`}
                style={{
                  fontSize: '20px',
                  transform: `rotate(${pullDistance * 3}deg)`,
                  transition: 'transform 0.1s ease'
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
              <p className="text-white/60 text-sm font-medium leading-tight mb-0.5">ยินดีต้อนรับ,</p>
              <p className="text-white text-xl font-bold leading-tight">
                {profile?.displayName || "Partner"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("medium");
              refreshStats();
            }}
            disabled={isRefreshing}
            className="flex items-center justify-center size-11 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 active:scale-95"
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
              <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-aiya-purple via-[#5C499D] to-[#7B68EE] shadow-[0_12px_40px_rgba(58,35,181,0.35)]">
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
                    <h1 className="text-white text-[2.75rem] font-extrabold tracking-tight leading-none drop-shadow-lg">
                      ฿ {formatCommission(displayData.stats.totalCommission)}
                    </h1>
                    <p className="text-white/80 text-sm font-medium mt-2">
                      อัปเดตเมื่อ {lastUpdated ? 'เมื่อสักครู่' : 'เร็วๆ นี้'}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((displayData.stats.totalCommission / 2000000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-white ml-4 whitespace-nowrap">เป้าหมาย: ฿ 20k</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Total Referrals, Pending & Paid */}
            <div className="flex flex-wrap gap-5 p-5">
              <div className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-blue-500/20 shadow-sm hover:border-blue-500/40 transition-colors">
                <div className="size-11 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">ผู้ใช้โค้ด</p>
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
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">รอตรวจสอบ</p>
                  <p className="text-purple-400 tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
                    ฿{formatCommission(displayData.stats.pendingCommission)}
                  </p>
                </div>
              </div>
              <div className="flex min-w-[140px] flex-1 flex-col gap-4 rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-emerald-500/20 shadow-sm hover:border-emerald-500/40 transition-colors">
                <div className="size-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium leading-normal mb-1">จ่ายแล้ว</p>
                  <p className="text-emerald-400 tracking-tight text-2xl font-bold leading-tight whitespace-nowrap">
                    ฿{formatCommission(paidCommission)}
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Code Section */}
            <div className="px-5 pb-6">
              <label className="text-sm text-slate-400 font-medium ml-1 mb-3 block">รหัสแนะนำของคุณ</label>
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent rounded-2xl border border-blue-500/30 p-2 pl-6 shadow-sm">
                <span className="text-white font-bold text-xl tracking-widest font-mono drop-shadow-lg">
                  {displayData.affiliate.affiliateCode}
                </span>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    copyToClipboard(displayData.affiliate.affiliateCode);
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-white hover:bg-blue-500/30 transition-colors active:scale-95"
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
                onClick={() => {
                  triggerHaptic("medium");
                  shareToLine();
                }}
                disabled={isSharing}
                className={`relative w-full cursor-pointer overflow-hidden rounded-full h-14 bg-line-green hover:bg-[#05b34c] transition-colors text-white shadow-lg shadow-green-900/30 group active:scale-95 ${
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
                onClick={() => {
                  triggerHaptic("light");
                  copyReferralLink();
                }}
                className="w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 border border-aiya-purple/30 bg-gradient-to-r from-aiya-purple/20 to-transparent hover:from-aiya-purple/30 hover:to-aiya-purple/10 text-white transition-all active:scale-95 shadow-lg shadow-aiya-purple/10"
              >
                <div className="flex items-center justify-center gap-3 px-5">
                  <span className="material-symbols-outlined text-2xl text-white">
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
                  handleFetchReferrals();
                  triggerHaptic("light");
                }}
                disabled={isLoadingReferrals}
                className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-white text-xl ${isLoadingReferrals ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>
            </div>

            {isLoadingReferrals ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4"></div>
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
                      className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-5 hover:border-aiya-purple/40 transition-colors"
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
                <p className="text-slate-500 text-xs">รหัสของคุณ: <span className="text-white font-bold">{displayData?.affiliate.affiliateCode}</span></p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && displayData && (
          <div className="px-5 mt-4">
            <h2 className="text-2xl font-bold text-white mb-6">ข้อมูลบัญชี</h2>

            {/* User Info Section */}
            <div className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">ข้อมูลผู้ใช้</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">ชื่อ</label>
                  <input
                    type="text"
                    value={displayData.affiliate.name}
                    readOnly
                    className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">อีเมล</label>
                  <input
                    type="email"
                    value={displayData.affiliate.email}
                    readOnly
                    className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">เบอร์โทรศัพท์</label>
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
                <h3 className="text-lg font-semibold text-white">ข้อมูลบัญชีธนาคาร</h3>
                {displayData.affiliate.bankName && displayData.affiliate.bankAccountNumber && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                    <span className="text-emerald-400 text-xs font-semibold">บันทึกแล้ว</span>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* Bank Selector Button */}
                <div>
                  <label className="text-sm text-slate-400 mb-3 block">เลือกธนาคาร</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBankModal(true);
                      triggerHaptic("light");
                    }}
                    className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-4 hover:border-blue-400/50 transition-all active:scale-[0.99] flex items-center gap-3"
                  >
                    {selectedBankData ? (
                      <>
                        <div className="w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center flex-shrink-0 shadow-md">
                          <img
                            src={selectedBankData.logo}
                            alt={selectedBankData.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to colored circle with initials
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.style.backgroundColor = selectedBankData.color;
                                parent.innerHTML = `<span class="text-white text-sm font-bold">${selectedBankData.id.substring(0, 2).toUpperCase()}</span>`;
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{selectedBankData.name}</p>
                          <p className="text-slate-400 text-xs">{selectedBankData.fullName}</p>
                        </div>
                        <span className="material-symbols-outlined text-blue-400">edit</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-slate-400">account_balance</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-slate-400">เลือกธนาคาร</p>
                          <p className="text-slate-500 text-xs">กดเพื่อเลือกธนาคารของคุณ</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">arrow_forward_ios</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Account Number */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">เลขที่บัญชี</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => handleAccountNumberChange(e.target.value)}
                      placeholder="xxx-x-xxxxx-x"
                      maxLength={13}
                      className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 pr-24 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50 transition-colors font-mono tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={handlePasteAccountNumber}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">content_paste</span>
                      <span>วาง</span>
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">ชื่อบัญชี</label>
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
                  <label className="text-sm text-slate-400 mb-2 block">รูปภาพหน้าสมุดบัญชี</label>

                  {passbookPreview ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassbookModal(true);
                        triggerHaptic("light");
                      }}
                      className="w-full aspect-video rounded-xl overflow-hidden bg-aiya-navy/50 border border-aiya-purple/20 hover:border-blue-400/50 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <img
                        src={passbookPreview}
                        alt="Passbook preview"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-aiya-purple/30 bg-aiya-navy/30 hover:border-blue-400/50 hover:bg-aiya-navy/50 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.99]"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-400 text-3xl">upload_file</span>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium mb-1">อัปโหลดรูปหน้าสมุดบัญชี</p>
                        <p className="text-slate-400 text-xs">รองรับ JPG, PNG (ไม่เกิน 2MB)</p>
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
                disabled={!hasFormChanges() || saveButtonState === 'loading' || saveButtonState === 'success'}
                className={`w-full mt-6 font-bold py-3 px-6 rounded-full transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                  saveButtonState === 'success'
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    : saveButtonState === 'loading'
                    ? 'bg-gradient-to-r from-aiya-purple to-[#5C499D] cursor-wait shadow-aiya-purple/20'
                    : 'bg-gradient-to-r from-aiya-purple to-[#5C499D] hover:from-aiya-purple/80 hover:to-[#5C499D]/80 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-aiya-purple/20'
                } text-white`}
              >
                {saveButtonState === 'loading' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : saveButtonState === 'success' ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
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
        <div className="fixed bottom-0 left-0 z-50 w-full bg-aiya-navy/95 backdrop-blur-xl border-t border-aiya-purple/20 shadow-[0_-4px_20px_rgba(58,35,181,0.15)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex h-16 items-center justify-around px-2">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab('dashboard');
              }}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95 ${
                activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
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
              onClick={() => {
                triggerHaptic("light");
                setActiveTab('history');
              }}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95 ${
                activeTab === 'history' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
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
              onClick={() => {
                triggerHaptic("light");
                setActiveTab('profile');
              }}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95 ${
                activeTab === 'profile' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
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
