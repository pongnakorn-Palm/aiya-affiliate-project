import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import StepLayout from "../components/StepLayout";
import StepIndicator from "../components/StepIndicator";

interface LineProfile {
  displayName: string;
  pictureUrl?: string;
}

interface PersonalInfoStepProps {
  name: string;
  email: string;
  phone: string;
  errors: {
    name?: string;
    email?: string;
    phone?: string;
  };
  emailAvailability: "checking" | "available" | "taken" | null;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onFieldBlur: (field: string) => void;
  onNext: () => void;
  isLineLoggedIn?: boolean;
  lineProfile?: LineProfile;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function PersonalInfoStep({
  name,
  email,
  phone,
  errors,
  emailAvailability,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onFieldBlur,
  onNext,
  isLineLoggedIn,
  lineProfile,
}: PersonalInfoStepProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Auto-focus name input on mount (only if empty)
  useEffect(() => {
    if (!name && nameRef.current) {
      nameRef.current.focus();
    }
  }, [name]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef?: React.RefObject<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onNext();
    }
  };

  // Format phone number with dashes (0xx-xxx-xxxx)
  const formatPhoneDisplay = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract only digits from input
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onPhoneChange(rawDigits);
  };

  const header = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {/* Step Indicator */}
        <StepIndicator total={2} current={0} variant="bars" />

        {/* LINE Badge */}
        {isLineLoggedIn && lineProfile && (
          <div className="flex items-center gap-2 bg-[#06C755]/10 pl-1 pr-2.5 py-1 rounded-full border border-[#06C755]/20">
            {lineProfile.pictureUrl ? (
              <img
                src={lineProfile.pictureUrl}
                alt={lineProfile.displayName}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#06C755]/30 flex items-center justify-center text-white text-[10px] font-semibold">
                {lineProfile.displayName?.charAt(0)}
              </div>
            )}
            <span className="text-[11px] text-[#06C755] font-medium">LINE</span>
          </div>
        )}
      </div>
      <div>
        <h1 className="text-xl font-bold text-white">กรอกข้อมูลส่วนตัว</h1>
        <p className="text-sm text-white/50 mt-1">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสมัครเป็นพาร์ทเนอร์</p>
      </div>
    </div>
  );

  const footer = (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onNext}
      disabled={!name || !email || !phone}
      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary-dark to-primary text-white font-bold text-base shadow-lg shadow-primary/30 disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:from-white/10 disabled:to-white/10 transition-all"
    >
      ถัดไป
    </motion.button>
  );

  return (
    <StepLayout header={header} footer={footer}>
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="space-y-5 pt-4 pb-2 flex-1 flex flex-col"
      >
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            ชื่อ-นามสกุล <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
              person
            </span>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => onFieldBlur("name")}
              onKeyDown={(e) => handleKeyDown(e, emailRef)}
              enterKeyHint="next"
              placeholder="กรอกชื่อ-นามสกุล"
              className={`w-full bg-[#1A1D21] border rounded-xl pl-12 pr-4 py-3.5 text-white text-base placeholder:text-white/30 focus:outline-none transition-colors ${
                errors.name
                  ? "border-red-400/50 focus:border-red-400"
                  : "border-white/10 focus:border-primary/50"
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            อีเมล <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
              mail
            </span>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onBlur={() => onFieldBlur("email")}
              onKeyDown={(e) => handleKeyDown(e, phoneRef)}
              enterKeyHint="next"
              placeholder="example@email.com"
              className={`w-full bg-[#1A1D21] border rounded-xl pl-12 pr-11 py-3.5 text-white text-base placeholder:text-white/30 focus:outline-none transition-colors ${
                errors.email || emailAvailability === "taken"
                  ? "border-red-400/50 focus:border-red-400"
                  : emailAvailability === "available"
                    ? "border-green-400/50 focus:border-green-400"
                    : "border-white/10 focus:border-primary/50"
              }`}
            />
            {/* Email Status Indicator */}
            {emailAvailability && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailAvailability === "checking" && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                )}
                {emailAvailability === "available" && (
                  <span className="material-symbols-outlined text-green-400 text-lg">
                    check_circle
                  </span>
                )}
                {emailAvailability === "taken" && (
                  <span className="material-symbols-outlined text-red-400 text-lg">
                    cancel
                  </span>
                )}
              </div>
            )}
          </div>
          {emailAvailability === "taken" && !errors.email && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              อีเมลนี้ถูกลงทะเบียนแล้ว
            </p>
          )}
          {errors.email && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            เบอร์โทรศัพท์ <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
              phone
            </span>
            <input
              ref={phoneRef}
              type="tel"
              value={formatPhoneDisplay(phone)}
              onChange={handlePhoneInputChange}
              onBlur={() => onFieldBlur("phone")}
              onKeyDown={handlePhoneKeyDown}
              enterKeyHint="done"
              maxLength={12}
              inputMode="numeric"
              placeholder="0xx-xxx-xxxx"
              className={`w-full bg-[#1A1D21] border rounded-xl pl-12 pr-4 py-3.5 text-white text-base placeholder:text-white/30 focus:outline-none transition-colors font-mono tracking-wide ${
                errors.phone
                  ? "border-red-400/50 focus:border-red-400"
                  : "border-white/10 focus:border-primary/50"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.phone}
            </p>
          )}
        </div>
      </motion.div>
    </StepLayout>
  );
}
