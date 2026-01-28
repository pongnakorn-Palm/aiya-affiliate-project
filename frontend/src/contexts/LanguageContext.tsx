import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "th" | "en";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  isTransitioning: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  th: {
    // Header
    "header.welcome": "ยินดีต้อนรับ",
    "header.partner": "พาร์ทเนอร์",

    // Dashboard Tab
    "dashboard.title": "แดชบอร์ด",
    "dashboard.overview": "ภาพรวม",
    "dashboard.totalRevenue": "รายได้รวม",
    "dashboard.pending": "รอตรวจสอบ",
    "dashboard.approved": "อนุมัติแล้ว",
    "dashboard.paid": "จ่ายแล้ว",
    "dashboard.referralCode": "รหัสแนะนำพิเศษ",
    "dashboard.shareCode": "แชร์รหัส",
    "dashboard.sharing": "กำลังแชร์...",
    "dashboard.activity": "กิจกรรมล่าสุด",
    "dashboard.registrations": "จำนวนลูกค้า",
    "dashboard.weekly": "จำนวนลูกค้า 7 วันย้อนหลัง",
    "dashboard.noData": "ยังไม่มีข้อมูล",
    "dashboard.startSharing": "เริ่มแชร์รหัสของคุณเพื่อดูสถิติ",
    "dashboard.growthTrend": "แนวโน้มการเติบโต",
    "dashboard.maxPersons": "สูงสุด {count} คน",
    "dashboard.persons": "คน",
    "dashboard.shareDescription": "แชร์รหัสนี้ให้เพื่อนเพื่อรับค่าคอมมิชชั่น",
    "dashboard.copy": "คัดลอก",
    "dashboard.copied": "คัดลอกแล้ว!",
    "dashboard.shareLink": "แชร์ลิงก์",
    "dashboard.shareToLine": "แชร์ให้เพื่อนใน LINE",

    // History Tab
    "history.title": "ประวัติ",
    "history.records": "รายการ",
    "history.all": "ทั้งหมด",
    "history.pending": "รอตรวจสอบ",
    "history.approved": "อนุมัติ",
    "history.rejected": "ปฏิเสธ",
    "history.empty": "ยังไม่มีรายการ",
    "history.emptyDesc": "เมื่อมีคนใช้รหัสแนะนำของคุณ",
    "history.emptyDesc2": "รายการจะแสดงที่นี่",
    "history.pullToRefresh": "ดึงลงเพื่อรีเฟรช",
    "history.pullToRetry": "ดึงลงเพื่อลองใหม่",
    "history.today": "วันนี้",
    "history.yesterday": "เมื่อวาน",

    // Profile Tab
    "profile.title": "โปรไฟล์",
    "profile.partnerId": "Affiliate Code",
    "profile.commissionRates": "อัตราค่าคอมมิชชั่น",
    "profile.singleSeat": "Single Seat",
    "profile.duoPack": "Duo Pack",
    "profile.perPerson": "ต่อคน",
    "profile.perPackage": "ต่อแพ็กเกจ",
    "profile.bankInfo": "ข้อมูลบัญชีธนาคาร",
    "profile.update": "อัปเดต",
    "profile.verified": "ยืนยันแล้ว",
    "profile.addBank": "เพิ่มบัญชีธนาคาร",
    "profile.addBankDesc": "เพิ่มบัญชีธนาคารเพื่อรับค่าคอมมิชชั่น",
    "profile.logout": "ออกจากระบบ",

    // Bank Form
    "bank.title": "เพิ่มบัญชีธนาคาร",
    "bank.selectBank": "เลือกธนาคาร",
    "bank.selectBankPlaceholder": "เลือกธนาคารของคุณ",
    "bank.accountNumber": "เลขที่บัญชี",
    "bank.accountNumberPlaceholder": "000-0-00000-0",
    "bank.accountName": "ชื่อบัญชี",
    "bank.accountNamePlaceholder": "ชื่อภาษาอังกฤษ",
    "bank.accountNameNote": "ชื่อต้องตรงกับบัตรประชาชน",
    "bank.passbook": "อัปโหลดสำเนาบัญชี",
    "bank.passbookNote": "ภาพถ่ายหน้าแรกของสมุดบัญชีธนาคาร",
    "bank.uploadImage": "อัปโหลดรูปภาพ",
    "bank.changeImage": "เปลี่ยนรูปภาพ",
    "bank.save": "บันทึก",
    "bank.saving": "กำลังบันทึก...",
    "bank.saved": "บันทึกแล้ว ✓",

    // Notifications
    "notification.title": "การแจ้งเตือน",
    "notification.clearAll": "ล้างทั้งหมด",
    "notification.empty": "ไม่มีการแจ้งเตือนใหม่",
    "notification.emptyDesc": "เมื่อมีกิจกรรมจะแสดงที่นี่",
    "notification.viewHistory": "ดูประวัติทั้งหมด →",

    // Bottom Navigation
    "nav.dashboard": "แดชบอร์ด",
    "nav.history": "ประวัติ",
    "nav.profile": "โปรไฟล์",

    // Status
    "status.pending": "รอดำเนินการ",
    "status.approved": "อนุมัติ",
    "status.rejected": "ปฏิเสธ",
    "status.paid": "จ่ายแล้ว",

    // Common
    "common.loading": "กำลังโหลด...",
    "common.error": "เกิดข้อผิดพลาด",
    "common.retry": "ลองใหม่อีกครั้ง",
    "common.close": "ปิด",
    "common.back": "ย้อนกลับ",
  },
  en: {
    // Header
    "header.welcome": "Welcome",
    "header.partner": "Partner",

    // Dashboard Tab
    "dashboard.title": "Dashboard",
    "dashboard.overview": "Overview",
    "dashboard.totalRevenue": "Total Revenue",
    "dashboard.pending": "Pending Review",
    "dashboard.approved": "Approved",
    "dashboard.paid": "Paid",
    "dashboard.referralCode": "Special Referral Code",
    "dashboard.shareCode": "Share Code",
    "dashboard.sharing": "Sharing...",
    "dashboard.activity": "Recent Activity",
    "dashboard.registrations": "Total Customers",
    "dashboard.weekly": "Customers in last 7 days",
    "dashboard.noData": "No Data Yet",
    "dashboard.startSharing": "Start sharing your code to see stats",
    "dashboard.growthTrend": "Growth Trend",
    "dashboard.maxPersons": "Max {count} people",
    "dashboard.persons": "people",
    "dashboard.shareDescription": "Share this code with friends to earn commission",
    "dashboard.copy": "Copy",
    "dashboard.copied": "Copied!",
    "dashboard.shareLink": "Share Link",
    "dashboard.shareToLine": "Share with friends on LINE",

    // History Tab
    "history.title": "History",
    "history.records": "Records",
    "history.all": "All",
    "history.pending": "Pending",
    "history.approved": "Approved",
    "history.rejected": "Rejected",
    "history.empty": "No Records Yet",
    "history.emptyDesc": "When someone uses your referral code",
    "history.emptyDesc2": "records will appear here",
    "history.pullToRefresh": "Pull down to refresh",
    "history.pullToRetry": "Pull down to retry",
    "history.today": "Today",
    "history.yesterday": "Yesterday",

    // Profile Tab
    "profile.title": "Profile",
    "profile.partnerId": "Affiliate Code",
    "profile.commissionRates": "Commission Rates",
    "profile.singleSeat": "Single Seat",
    "profile.duoPack": "Duo Pack",
    "profile.perPerson": "per person",
    "profile.perPackage": "per package",
    "profile.bankInfo": "Bank Information",
    "profile.update": "Update",
    "profile.verified": "Verified",
    "profile.addBank": "Add Bank Account",
    "profile.addBankDesc": "Add bank account to receive commission",
    "profile.logout": "Logout",

    // Bank Form
    "bank.title": "Add Bank Account",
    "bank.selectBank": "Select Bank",
    "bank.selectBankPlaceholder": "Choose your bank",
    "bank.accountNumber": "Account Number",
    "bank.accountNumberPlaceholder": "000-0-00000-0",
    "bank.accountName": "Account Name",
    "bank.accountNamePlaceholder": "Name in English",
    "bank.accountNameNote": "Name must match your ID card",
    "bank.passbook": "Upload Passbook Copy",
    "bank.passbookNote": "Photo of the first page of your bank passbook",
    "bank.uploadImage": "Upload Image",
    "bank.changeImage": "Change Image",
    "bank.save": "Save",
    "bank.saving": "Saving...",
    "bank.saved": "Saved ✓",

    // Notifications
    "notification.title": "Notifications",
    "notification.clearAll": "Clear All",
    "notification.empty": "No New Notifications",
    "notification.emptyDesc": "Activity will appear here",
    "notification.viewHistory": "View All History →",

    // Bottom Navigation
    "nav.dashboard": "Dashboard",
    "nav.history": "History",
    "nav.profile": "Profile",

    // Status
    "status.pending": "Pending",
    "status.approved": "Approved",
    "status.rejected": "Rejected",
    "status.paid": "Paid",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error Occurred",
    "common.retry": "Try Again",
    "common.close": "Close",
    "common.back": "Back",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "th";
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setIsTransitioning(true);

    // Add a slight delay for smooth transition
    setTimeout(() => {
      setLanguage((prev) => (prev === "th" ? "en" : "th"));

      // End transition after language changes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isTransitioning }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
