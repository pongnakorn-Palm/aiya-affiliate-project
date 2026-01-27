import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import StepLayout from "../components/StepLayout";

interface AffiliateCodeStepProps {
  affiliateCode: string;
  pdpaConsent: boolean;
  codeAvailability: "checking" | "available" | "taken" | null;
  errors: {
    affiliateCode?: string;
    pdpaConsent?: string;
  };
  isLoading: boolean;
  onCodeChange: (value: string) => void;
  onPdpaChange: (checked: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function AffiliateCodeStep({
  affiliateCode,
  pdpaConsent,
  codeAvailability,
  errors,
  isLoading,
  onCodeChange,
  onPdpaChange,
  onBack,
  onSubmit,
}: AffiliateCodeStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, "");
    onCodeChange(value);
  };

  const handleSubmitClick = () => {
    if (!pdpaConsent) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onSubmit();
  };

  const canSubmit =
    affiliateCode.length >= 3 &&
    pdpaConsent &&
    codeAvailability !== "taken" &&
    codeAvailability !== "checking" &&
    !isLoading;

  const header = (
    <div className="flex items-center gap-4">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10 transition-colors"
      >
        <span className="material-symbols-outlined text-white text-xl">
          arrow_back
        </span>
      </motion.button>
      <h1 className="text-xl font-bold text-white">รหัส Affiliate ของคุณ</h1>
    </div>
  );

  const footer = (
    <motion.button
      whileTap={{ scale: canSubmit ? 0.98 : 1 }}
      onClick={handleSubmitClick}
      disabled={!canSubmit}
      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
        canSubmit
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
          : "bg-white/10 text-white/30"
      }`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          <span>กำลังดำเนินการ...</span>
        </>
      ) : (
        "ยืนยันการสมัคร"
      )}
    </motion.button>
  );

  return (
    <StepLayout header={header} footer={footer}>
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex-1 flex flex-col justify-center py-6"
      >
        {/* Affiliate Code Display */}
        <div className="text-center mb-8">
          <p className="text-white/40 text-sm mb-4">
            รหัสนี้จะใช้สำหรับแนะนำเพื่อนและรับค่าคอมมิชชั่น
          </p>

          <div className="relative max-w-sm mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={affiliateCode}
              onChange={handleCodeChange}
              maxLength={10}
              inputMode="text"
              lang="en"
              spellCheck="false"
              autoCorrect="off"
              autoCapitalize="characters"
              className={`w-full bg-[#1A1D21] border-2 rounded-2xl px-6 py-5 text-white text-center text-3xl font-bold font-mono tracking-widest focus:outline-none transition-all ${
                errors.affiliateCode || codeAvailability === "taken"
                  ? "border-red-400/50 focus:border-red-400"
                  : codeAvailability === "available"
                    ? "border-green-400/50 focus:border-green-400"
                    : "border-white/10 focus:border-yellow-400/50"
              } ${isShaking ? "animate-shake" : ""}`}
              placeholder="AIYABOY"
            />

            {/* Status Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {codeAvailability === "checking" && (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              )}
              {codeAvailability === "available" && (
                <span className="material-symbols-outlined text-green-400 text-2xl">
                  check_circle
                </span>
              )}
              {codeAvailability === "taken" && (
                <span className="material-symbols-outlined text-red-400 text-2xl">
                  cancel
                </span>
              )}
            </div>
          </div>

          {/* Status Message */}
          {codeAvailability === "available" && (
            <p className="text-green-400 text-sm mt-3 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-base">
                check_circle
              </span>
              รหัสนี้ว่าง สามารถใช้งานได้
            </p>
          )}
          {codeAvailability === "taken" && (
            <p className="text-red-400 text-sm mt-3 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-base">error</span>
              รหัสนี้ถูกใช้งานแล้ว กรุณาเลือกรหัสอื่น
            </p>
          )}
          {errors.affiliateCode && (
            <p className="text-red-400 text-sm mt-3 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-base">error</span>
              {errors.affiliateCode}
            </p>
          )}
        </div>

        {/* PDPA Consent */}
        <div
          className={`bg-[#1A1D21] rounded-2xl p-4 border transition-colors ${
            errors.pdpaConsent || (!pdpaConsent && isShaking)
              ? "border-red-400/30"
              : "border-white/5"
          }`}
        >
          <label
            htmlFor="pdpa-checkbox"
            className="flex items-start gap-3 cursor-pointer select-none"
          >
            <div className="relative shrink-0 mt-0.5">
              <input
                id="pdpa-checkbox"
                type="checkbox"
                checked={pdpaConsent}
                onChange={(e) => onPdpaChange(e.target.checked)}
                className="peer sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                  pdpaConsent
                    ? "border-yellow-400 bg-yellow-400"
                    : "border-white/30 bg-transparent"
                }`}
              >
                {pdpaConsent && (
                  <span className="material-symbols-outlined text-black text-sm font-bold">
                    check
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm text-white/70 leading-relaxed">
              ข้าพเจ้ายอมรับ{" "}
              <a
                href="https://web.aiya.ai/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-yellow-400 hover:underline"
              >
                เงื่อนไขการใช้งาน
              </a>{" "}
              และ{" "}
              <a
                href="https://web.aiya.ai/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-yellow-400 hover:underline"
              >
                นโยบายความเป็นส่วนตัว
              </a>{" "}
              ของ AIYA <span className="text-red-400">*</span>
            </span>
          </label>
        </div>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-white/40 text-xs">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span>ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย</span>
        </div>
      </motion.div>
    </StepLayout>
  );
}
