import { motion } from "framer-motion";
import { useState } from "react";
import { triggerHaptic } from "../../../utils/haptic";
import { getBankById } from "../../../constants/banks";
import { useBankForm } from "../hooks/useBankForm";
import type { DashboardData } from "../hooks/useReferralData";
import BankSelectorSheet from "../shared/BankSelectorSheet";
import { useLanguage } from "../../../contexts/LanguageContext";

interface ProfileTabProps {
  affiliate: DashboardData["affiliate"];
  userId: string | undefined;
  onRefresh: () => Promise<void>;
  profile?: {
    displayName: string;
    pictureUrl?: string;
  };
  onBankFormChange?: (isOpen: boolean) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function ProfileTab({
  affiliate,
  userId,
  onRefresh,
  profile,
  onBankFormChange,
}: ProfileTabProps) {
  const { language, toggleLanguage, t, isTransitioning } = useLanguage();
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);

  const handleBankFormToggle = (isOpen: boolean) => {
    setShowBankForm(isOpen);
    onBankFormChange?.(isOpen);
  };

  const {
    selectedBank,
    setSelectedBank,
    accountNumber,
    accountName,
    setAccountName,
    passbookPreview,
    saveButtonState,
    fileInputRef,
    hasChanges,
    handleAccountNumberChange,
    handleImageSelect,
    handleSave,
  } = useBankForm(affiliate, userId, onRefresh);

  const selectedBankData = getBankById(selectedBank);
  const hasBankInfo = affiliate.bankName && affiliate.bankAccountNumber;

  // Mask account number for display
  const maskAccountNumber = (num: string) => {
    if (!num) return "";
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length < 4) return "*".repeat(cleaned.length);
    return "**** **** **** " + cleaned.slice(-4);
  };

  const handleBankFormSave = async () => {
    await handleSave();
    if (saveButtonState === "success") {
      handleBankFormToggle(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-col min-h-[calc(100vh-120px)] bg-[#0F1216] font-sans relative"
    >
      {/* Language Transition Overlay */}
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0F1216]/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-3 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
            <p className="text-white text-sm font-medium">กำลังเปลี่ยนภาษา...</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeInUp} className="px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t("profile.title")}</h2>
          <button
            onClick={() => {
              toggleLanguage();
              triggerHaptic("light");
            }}
            className="px-4 py-2.5 rounded-xl bg-[#1A1D21] border border-white/5 flex items-center gap-2 hover:bg-[#22262B] transition-colors"
          >
            <span className="material-symbols-outlined text-white text-lg">language</span>
            <span className="text-white text-sm font-semibold">{language === "th" ? "TH" : "EN"}</span>
          </button>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={fadeInUp} className="px-5 mb-6">
        <div className="bg-[#1A1D21] rounded-2xl p-6 border border-white/5 text-center">
          {/* Avatar */}
          <div className="size-28 overflow-hidden rounded-full border-2 border-white/10 shadow-xl mx-auto mb-4">
            {profile?.pictureUrl ? (
              <img
                alt="Profile"
                className="size-full object-cover"
                src={profile.pictureUrl}
              />
            ) : (
              <div className="size-full bg-gradient-to-br from-purple-500/50 to-cyan-500/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-5xl">person</span>
              </div>
            )}
          </div>

          {/* Name & ID */}
          <h3 className="text-xl font-bold text-white mb-2">{affiliate.name}</h3>
          <p className="text-gray-400 text-sm">
            {t("profile.partnerId")}: <span className="text-gray-300">#{affiliate.affiliateCode}</span>
          </p>
        </div>
      </motion.div>

      {/* Commission Rates */}
      <motion.div variants={fadeInUp} className="px-5 mb-6">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-3">
          {t("profile.commissionRates")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A1D21] rounded-2xl p-4 border border-white/5">
            <div className="p-2 rounded-xl bg-yellow-400/20 w-fit mb-3">
              <span className="material-symbols-outlined text-yellow-400 text-xl">person</span>
            </div>
            <p className="text-gray-400 text-xs mb-1">{t("profile.singleSeat")}</p>
            <p className="text-xl font-bold text-white">
              3,000<span className="text-yellow-400 text-base">฿</span>
            </p>
            <p className="text-[10px] text-gray-500">{t("profile.perPerson")}</p>
          </div>
          <div className="bg-[#1A1D21] rounded-2xl p-4 border border-white/5">
            <div className="p-2 rounded-xl bg-cyan-500/20 w-fit mb-3">
              <span className="material-symbols-outlined text-cyan-400 text-xl">group</span>
            </div>
            <p className="text-gray-400 text-xs mb-1">{t("profile.duoPack")}</p>
            <p className="text-xl font-bold text-white">
              7,000<span className="text-yellow-400 text-base">฿</span>
            </p>
            <p className="text-[10px] text-gray-500">{t("profile.perPackage")}</p>
          </div>
        </div>
      </motion.div>

      {/* Bank Information */}
      <motion.div variants={fadeInUp} className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
            {t("profile.bankInfo")}
          </p>
          {hasBankInfo && (
            <button
              onClick={() => handleBankFormToggle(true)}
              className="text-cyan-400 text-xs font-medium"
            >
              {t("profile.update")}
            </button>
          )}
        </div>

        {hasBankInfo ? (
          <div className="bg-[#1A1D21] rounded-2xl p-4 border border-green-500/30 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <span className="material-symbols-outlined text-white text-xl">account_balance</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold">{affiliate.bankName}</p>
                  <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                    {t("profile.verified")}
                  </span>
                </div>
                <p className="text-gray-400 text-sm font-mono">
                  {maskAccountNumber(affiliate.bankAccountNumber || "")}
                </p>
                {affiliate.bankAccountName && (
                  <p className="text-gray-500 text-xs">{affiliate.bankAccountName}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => handleBankFormToggle(true)}
            className="w-full bg-[#1A1D21] rounded-2xl p-5 border border-white/5 border-dashed flex items-center justify-center gap-3 hover:border-yellow-400/30 transition-colors"
          >
            <div className="p-2 rounded-xl bg-yellow-400/20">
              <span className="material-symbols-outlined text-yellow-400 text-xl">add</span>
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{t("profile.addBank")}</p>
              <p className="text-gray-500 text-xs">{t("profile.addBankDesc")}</p>
            </div>
          </button>
        )}
      </motion.div>


      {/* Bank Form Modal */}
      {showBankForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col"
          onClick={() => handleBankFormToggle(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="w-full bg-[#0F1216] rounded-t-3xl max-h-[90vh] flex flex-col mt-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="flex-shrink-0 bg-[#0F1216] px-5 py-4 border-b border-white/5 flex items-center justify-between rounded-t-3xl">
              <button
                onClick={() => handleBankFormToggle(false)}
                className="active:opacity-50 transition-opacity"
              >
                <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
              </button>
              <h3 className="text-lg font-bold text-white">{t("bank.title")}</h3>
              <div className="w-6"></div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)" }}>
              {/* Bank Selector */}
              <div className="bg-[#1A1D21] rounded-2xl p-5 border border-white/5">
                <label className="text-sm text-gray-400 mb-3 block">{t("bank.selectBank")}</label>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setShowBankSheet(true);
                    triggerHaptic("light");
                  }}
                  className="w-full bg-[#0F1216] border border-white/10 rounded-xl px-4 py-3.5 text-left flex items-center gap-3 hover:border-yellow-400/30 focus:outline-none transition-colors"
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
                        <span className="text-white font-medium">{selectedBankData.abbr}</span>
                        <span className="text-gray-400 ml-2">- {selectedBankData.name}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-gray-400">account_balance</span>
                      <span className="text-gray-400">{t("bank.selectBankPlaceholder")}</span>
                    </>
                  )}
                  <span className="material-symbols-outlined text-gray-400 ml-auto">expand_more</span>
                </motion.button>

                {/* Account Number */}
                <div className="mt-4">
                  <label className="text-sm text-gray-400 mb-2 block">{t("bank.accountNumber")}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5">
                      <span className="material-symbols-outlined text-gray-400 text-base">123</span>
                    </div>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => handleAccountNumberChange(e.target.value)}
                      placeholder={t("bank.accountNumberPlaceholder")}
                      maxLength={13}
                      className="w-full bg-[#0F1216] border border-white/10 rounded-xl pl-14 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Account Name */}
                <div className="mt-4">
                  <label className="text-sm text-gray-400 mb-2 block">{t("bank.accountName")}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5">
                      <span className="material-symbols-outlined text-gray-400 text-base">person</span>
                    </div>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder={t("bank.accountNamePlaceholder")}
                      className="w-full bg-[#0F1216] border border-white/10 rounded-xl pl-14 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{t("bank.accountNameNote")}</p>
                </div>
              </div>

              {/* Passbook Upload */}
              <div className="bg-[#1A1D21] rounded-2xl p-5 border border-white/5">
                <label className="text-sm text-gray-400 mb-3 block">{t("bank.passbook")}</label>
                {passbookPreview ? (
                  <div className="relative w-full aspect-[4/3] max-h-64 rounded-xl overflow-hidden bg-[#0F1216] border border-white/10">
                    <img
                      src={passbookPreview}
                      alt="Passbook preview"
                      className="w-full h-full object-cover"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-white text-lg">edit</span>
                    </motion.button>
                    <div className="absolute bottom-2 left-2 bg-yellow-500/90 px-2 py-1 rounded-lg flex items-center gap-1">
                      <span className="text-[10px] font-bold text-black uppercase">JPG</span>
                    </div>
                    <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[4/3] max-h-64 rounded-xl border-2 border-dashed border-white/10 bg-[#0F1216] hover:border-yellow-400/30 transition-all flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 text-2xl">upload_file</span>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium mb-1">{t("bank.uploadImage")}</p>
                      <p className="text-gray-500 text-xs">{t("bank.passbookNote")}</p>
                    </div>
                  </motion.button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Security Notice */}
              <div className="bg-cyan-500/10 rounded-2xl p-4 border border-cyan-500/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-lg mt-0.5 flex-shrink-0">lock</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium mb-1">ข้อมูลบัญชีปลอดภัย</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    ข้อมูลธนาคารของคุณถูกเข้ารหัสและจะใช้เพื่อโอนค่าคอมมิชชั่นเท่านั้น
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleBankFormSave}
                disabled={!hasChanges() || saveButtonState === "loading" || saveButtonState === "success"}
                className={`w-full font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  saveButtonState === "success"
                    ? "bg-green-500 text-white"
                    : saveButtonState === "loading"
                      ? "bg-yellow-400/50 text-black cursor-wait"
                      : "bg-yellow-400 text-black shadow-lg shadow-empire-gold/20 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                }`}
              >
                {saveButtonState === "loading" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>{t("bank.saving")}</span>
                  </>
                ) : saveButtonState === "success" ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{t("bank.saved")}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">verified</span>
                    <span>{t("bank.save")}</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bank Selector Bottom Sheet */}
      <BankSelectorSheet
        isOpen={showBankSheet}
        onClose={() => setShowBankSheet(false)}
        selectedBank={selectedBank}
        onSelect={setSelectedBank}
      />
    </motion.div>
  );
}
