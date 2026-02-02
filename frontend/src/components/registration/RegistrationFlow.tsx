import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import AffiliateCodeStep from "./steps/AffiliateCodeStep";
import { triggerHaptic } from "../../utils/haptic";

interface FormData {
  name: string;
  email: string;
  phone: string;
  affiliateCode: string;
  pdpaConsent: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  affiliateCode?: string;
  pdpaConsent?: string;
}

interface LineProfile {
  displayName: string;
  pictureUrl?: string;
}

interface RegistrationFlowProps {
  initialData?: Partial<FormData>;
  lineUserId?: string;
  isLineLoggedIn?: boolean;
  lineProfile?: LineProfile;
  onBack?: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

export default function RegistrationFlow({
  initialData,
  lineUserId,
  isLineLoggedIn,
  lineProfile,
}: RegistrationFlowProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    affiliateCode: initialData?.affiliateCode || "",
    pdpaConsent: false,
  });

  // Sync initialData when LINE profile loads (async)
  useEffect(() => {
    if (initialData?.name && !formData.name) {
      setFormData((prev) => ({ ...prev, name: initialData.name || "" }));
    }
    if (initialData?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: initialData.email || "" }));
    }
  }, [initialData?.name, initialData?.email]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [, setTouched] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [codeAvailability, setCodeAvailability] = useState<
    "checking" | "available" | "taken" | "error" | null
  >(null);
  const [emailAvailability, setEmailAvailability] = useState<
    "checking" | "available" | "taken" | "error" | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emailDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (emailDebounceTimerRef.current)
        clearTimeout(emailDebounceTimerRef.current);
    };
  }, []);

  // Validation functions
  const validateField = useCallback(
    (fieldName: string, value: string | boolean): string | undefined => {
      switch (fieldName) {
        case "name":
          if (!value || (typeof value === "string" && value.trim().length === 0))
            return "กรุณากรอกชื่อ-นามสกุล";
          break;
        case "email":
          if (!value || (typeof value === "string" && value.trim().length === 0))
            return "กรุณากรอกอีเมล";
          if (
            typeof value === "string" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          )
            return "รูปแบบอีเมลไม่ถูกต้อง";
          break;
        case "phone":
          if (!value || (typeof value === "string" && value.trim().length === 0))
            return "กรุณากรอกเบอร์โทรศัพท์";
          if (typeof value === "string" && value.length < 9)
            return "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก";
          if (typeof value === "string" && value.length > 10)
            return "เบอร์โทรศัพท์ต้องไม่เกิน 10 หลัก";
          break;
        case "affiliateCode":
          if (!value || (typeof value === "string" && value.trim().length === 0))
            return "กรุณากรอก Affiliate Code";
          if (typeof value === "string" && !/^[A-Z0-9]+$/.test(value))
            return "ใช้ได้เฉพาะตัวอักษร A-Z และตัวเลข 0-9";
          if (typeof value === "string" && value.length < 3)
            return "รหัสต้องมีอย่างน้อย 3 ตัวอักษร";
          if (typeof value === "string" && value.length > 10)
            return "รหัสต้องไม่เกิน 10 ตัวอักษร";
          break;
        case "pdpaConsent":
          if (!value) return "กรุณายอมรับเงื่อนไขการใช้งาน";
          break;
      }
      return undefined;
    },
    []
  );

  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      setTouched((prev) => new Set(prev).add(fieldName));
      const error = validateField(
        fieldName,
        formData[fieldName as keyof FormData]
      );
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    },
    [formData, validateField]
  );

  // API calls
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailability(null);
      return false;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/check-affiliate?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      const isTaken = data.exists;
      setEmailAvailability(isTaken ? "taken" : "available");
      return isTaken;
    } catch {
      setEmailAvailability("error");
      return false;
    }
  }, []);

  const checkCodeAvailability = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setCodeAvailability(null);
      return false;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/check-affiliate?affiliateCode=${code}`
      );
      const data = await response.json();
      const isTaken = data.exists;
      setCodeAvailability(isTaken ? "taken" : "available");
      return isTaken;
    } catch {
      setCodeAvailability("error");
      return false;
    }
  }, []);

  // Generate affiliate code
  const generateAffiliateCode = useCallback(
    (name: string, phone: string): string => {
      const englishLetters = name.match(/[A-Za-z]/g);
      let prefix: string;
      if (englishLetters && englishLetters.length >= 3) {
        prefix = englishLetters.slice(0, 3).join("").toUpperCase();
      } else {
        prefix = "AIYA";
      }
      const phoneDigits = phone.replace(/\D/g, "");
      const suffix = phoneDigits.slice(-4);
      return prefix + suffix;
    },
    []
  );

  // Field handlers
  const handleNameChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    setErrors((prev) => ({ ...prev, name: undefined }));
  }, []);

  const handleEmailChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, email: value }));
      setErrors((prev) => ({ ...prev, email: undefined }));
      setEmailAvailability(null);

      if (emailDebounceTimerRef.current) {
        clearTimeout(emailDebounceTimerRef.current);
      }

      if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setEmailAvailability("checking");
        emailDebounceTimerRef.current = setTimeout(() => {
          checkEmailAvailability(value);
        }, 500);
      }
    },
    [checkEmailAvailability]
  );

  const handlePhoneChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    setErrors((prev) => ({ ...prev, phone: undefined }));
  }, []);

  const handleCodeChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, affiliateCode: value }));
      setErrors((prev) => ({ ...prev, affiliateCode: undefined }));
      setCodeAvailability(null);
      setSubmitError(null);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (value.length >= 3) {
        setCodeAvailability("checking");
        debounceTimerRef.current = setTimeout(() => {
          checkCodeAvailability(value);
        }, 500);
      }
    },
    [checkCodeAvailability]
  );

  const handlePdpaChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, pdpaConsent: checked }));
    setErrors((prev) => ({ ...prev, pdpaConsent: undefined }));
  }, []);

  // Step 1 validation and navigation
  const handleStep1Next = useCallback(async () => {
    const nameError = validateField("name", formData.name);
    const emailError = validateField("email", formData.email);
    const phoneError = validateField("phone", formData.phone);

    setTouched(new Set(["name", "email", "phone"]));
    setErrors({ name: nameError, email: emailError, phone: phoneError });

    if (nameError || emailError || phoneError) {
      triggerHaptic("light");
      return;
    }

    // Check email availability
    if (formData.email) {
      const emailTaken = await checkEmailAvailability(formData.email);
      if (emailTaken) {
        setErrors((prev) => ({
          ...prev,
          email: "อีเมลนี้ถูกลงทะเบียนแล้ว",
        }));
        triggerHaptic("light");
        return;
      }
    }

    // Auto-generate affiliate code with smart retry
    if (!formData.affiliateCode.trim()) {
      const baseCode = generateAffiliateCode(formData.name, formData.phone);
      let finalCode = baseCode;

      for (let attempt = 0; attempt <= 5; attempt++) {
        const codeToCheck = attempt === 0 ? baseCode : `${baseCode}${attempt}`;
        const isTaken = await checkCodeAvailability(codeToCheck);

        if (!isTaken) {
          finalCode = codeToCheck;
          break;
        }
      }

      setFormData((prev) => ({ ...prev, affiliateCode: finalCode }));
    }

    triggerHaptic("medium");
    setDirection(1);
    setCurrentStep(1);
  }, [
    formData,
    validateField,
    checkEmailAvailability,
    generateAffiliateCode,
    checkCodeAvailability,
  ]);

  // Back to step 1
  const handleBackToStep1 = useCallback(() => {
    triggerHaptic("light");
    setDirection(-1);
    setCurrentStep(0);
  }, []);

  // Submit
  const handleSubmit = useCallback(async () => {
    // Final validation
    const codeError = validateField("affiliateCode", formData.affiliateCode);
    const pdpaError = validateField("pdpaConsent", formData.pdpaConsent);

    if (codeError || pdpaError) {
      setErrors((prev) => ({
        ...prev,
        affiliateCode: codeError,
        pdpaConsent: pdpaError,
      }));
      triggerHaptic("light");
      return;
    }

    // Final code availability check
    if (formData.affiliateCode) {
      const isTaken = await checkCodeAvailability(formData.affiliateCode);
      if (isTaken) {
        triggerHaptic("light");
        return;
      }
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";

      // Step 1: Register in event DB
      const eventDbResponse = await fetch(`${apiUrl}/api/register-affiliate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lineUserId,
        }),
      });

      let eventDbData: { emailSent?: boolean; field?: string; message?: string };
      try {
        eventDbData = await eventDbResponse.json();
      } catch {
        if (!eventDbResponse.ok) {
          throw new Error(`การลงทะเบียนล้มเหลว (Status: ${eventDbResponse.status})`);
        }
        throw new Error("การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง");
      }

      if (!eventDbResponse.ok) {
        if (eventDbResponse.status === 409 && eventDbData.field) {
          setErrors((prev) => ({
            ...prev,
            [eventDbData.field!]: eventDbData.message,
          }));
          throw new Error(eventDbData.message);
        }
        throw new Error(
          eventDbData.message || "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง"
        );
      }

      // Step 2: Register in main system
      let mainSystemSuccess = false;
      try {
        const mainSystemResponse = await fetch(
          `${apiUrl}/api/register-affiliate-main`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              tel: formData.phone,
              generatedCode: formData.affiliateCode,
            }),
          }
        );

        if (mainSystemResponse.ok) {
          mainSystemSuccess = true;
        }
      } catch {
        mainSystemSuccess = false;
      }

      // Navigate to thank you
      triggerHaptic("medium");
      navigate("/thank-you", {
        state: {
          name: formData.name,
          affiliateCode: formData.affiliateCode,
          emailSent: eventDbData.emailSent ?? true,
          mainSystemSuccess,
        },
      });
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error ? err.message : "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง";
      setSubmitError(errorMessage);
      triggerHaptic("light");
    } finally {
      setIsLoading(false);
    }
  }, [formData, lineUserId, validateField, checkCodeAvailability, navigate]);

  return (
    <div className="relative h-[100dvh] bg-[#0F1216] overflow-hidden">
      {/* Steps */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            type: "tween",
            ease: [0.25, 0.1, 0.25, 1],
            duration: 0.3,
          }}
          className="absolute inset-0"
        >
          {currentStep === 0 && (
            <PersonalInfoStep
              name={formData.name}
              email={formData.email}
              phone={formData.phone}
              errors={errors}
              emailAvailability={emailAvailability}
              onNameChange={handleNameChange}
              onEmailChange={handleEmailChange}
              onPhoneChange={handlePhoneChange}
              onFieldBlur={handleFieldBlur}
              onNext={handleStep1Next}
              isLineLoggedIn={isLineLoggedIn}
              lineProfile={lineProfile}
            />
          )}

          {currentStep === 1 && (
            <AffiliateCodeStep
              affiliateCode={formData.affiliateCode}
              pdpaConsent={formData.pdpaConsent}
              codeAvailability={codeAvailability}
              errors={errors}
              isLoading={isLoading}
              submitError={submitError}
              onCodeChange={handleCodeChange}
              onPdpaChange={handlePdpaChange}
              onBack={handleBackToStep1}
              onSubmit={handleSubmit}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
