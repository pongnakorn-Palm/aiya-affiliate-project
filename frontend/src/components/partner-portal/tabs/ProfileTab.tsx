import { motion } from "framer-motion";
import { useState } from "react";
import { triggerHaptic } from "../../../utils/haptic";
import { getBankById } from "../../../constants/banks";
import { useBankForm } from "../hooks/useBankForm";
import type { DashboardData } from "../hooks/useReferralData";
import BankSelectorSheet from "../shared/BankSelectorSheet";

interface ProfileTabProps {
  affiliate: DashboardData["affiliate"];
  userId: string | undefined;
  onRefresh: () => Promise<void>;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ProfileTab({
  affiliate,
  userId,
  onRefresh,
}: ProfileTabProps) {
  const [showBankSheet, setShowBankSheet] = useState(false);

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
    handlePasteAccountNumber,
    handleImageSelect,
    handleSave,
  } = useBankForm(affiliate, userId, onRefresh);

  const selectedBankData = getBankById(selectedBank);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="px-5 mt-4 pb-8"
    >
      <motion.h2 variants={fadeInUp} className="text-2xl font-bold text-white mb-6">
        ข้อมูลบัญชี
      </motion.h2>

      {/* User Info Section */}
      <motion.div
        variants={fadeInUp}
        className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">ข้อมูลผู้ใช้</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">ชื่อ</label>
            <input
              type="text"
              value={affiliate.name}
              readOnly
              className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">อีเมล</label>
            <input
              type="email"
              value={affiliate.email}
              readOnly
              className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={affiliate.phone}
              readOnly
              className="w-full bg-aiya-navy/50 border border-aiya-purple/20 rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Bank Account Section */}
      <motion.div
        variants={fadeInUp}
        className="bg-white/5 backdrop-blur-md border border-aiya-purple/20 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">ข้อมูลบัญชีธนาคาร</h3>
          {affiliate.bankName && affiliate.bankAccountNumber && (
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
          {/* Bank Selector */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">เลือกธนาคาร</label>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setShowBankSheet(true);
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
              <span className="material-symbols-outlined text-slate-400 ml-auto">
                expand_more
              </span>
            </motion.button>
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
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handlePasteAccountNumber}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  content_paste
                </span>
                <span>วาง</span>
              </motion.button>
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

          {/* Passbook Image */}
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
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    triggerHaptic("light");
                  }}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-white text-lg">
                    edit
                  </span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-aiya-purple/30 bg-aiya-navy/30 hover:border-blue-400/50 hover:bg-aiya-navy/50 transition-all flex flex-col items-center justify-center gap-3"
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
        </div>

        {/* Save Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={
            !hasChanges() ||
            saveButtonState === "loading" ||
            saveButtonState === "success"
          }
          className={`w-full mt-6 font-bold py-3 px-6 rounded-full transition-all shadow-lg flex items-center justify-center gap-2 ${
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
              <span className="material-symbols-outlined">check_circle</span>
              <span>บันทึกเรียบร้อย!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              <span>บันทึกข้อมูลบัญชีธนาคาร</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Info Alert */}
      <motion.div
        variants={fadeInUp}
        className="bg-white/5 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6"
      >
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
      </motion.div>

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
