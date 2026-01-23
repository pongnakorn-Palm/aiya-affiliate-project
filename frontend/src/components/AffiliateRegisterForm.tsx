import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLiff } from "../contexts/LiffContext";

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

export default function AffiliateRegisterForm() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const { isLoggedIn, profile, login, isReady, isInClient } = useLiff();

  // Refs for input fields
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const affiliateCodeRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    affiliateCode: "",
    pdpaConsent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [codeAvailability, setCodeAvailability] = useState<
    "checking" | "available" | "taken" | null
  >(null);
  const [emailAvailability, setEmailAvailability] = useState<
    "checking" | "available" | "taken" | null
  >(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [emailDebounceTimer, setEmailDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLongLoading, setIsLongLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showStatusText, setShowStatusText] = useState(false);

  // Ref for AbortController to cancel pending requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const longLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTextTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is already registered and redirect to dashboard
  useEffect(() => {
    const checkExistingAffiliate = async () => {
      if (isLoggedIn && profile?.userId) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "";
          const response = await fetch(
            `${apiUrl}/api/affiliate/dashboard/${profile.userId}`
          );

          if (response.ok) {
            // User already registered, redirect to dashboard
            navigate("/portal", { replace: true });
          }
        } catch (error) {
          // If error, user probably not registered yet, continue showing form
          console.log("User not registered yet");
        }
      }
    };

    checkExistingAffiliate();
  }, [isLoggedIn, profile?.userId, navigate]);

  // Auto-fill form data from LINE profile (only if fields are empty)
  useEffect(() => {
    if (isLoggedIn && profile) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || profile.displayName || "",
        email: prev.email || profile.email || "",
      }));
    }
  }, [isLoggedIn, profile]);

  // Cleanup debounce timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (emailDebounceTimer) {
        clearTimeout(emailDebounceTimer);
      }
    };
  }, [debounceTimer, emailDebounceTimer]);

  // Cleanup abort controller and long loading timer on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (longLoadingTimerRef.current) {
        clearTimeout(longLoadingTimerRef.current);
      }
      if (statusTextTimerRef.current) {
        clearTimeout(statusTextTimerRef.current);
      }
    };
  }, []);

  // Show status text for 3 seconds when code availability changes
  useEffect(() => {
    if (codeAvailability === "available" || codeAvailability === "taken") {
      setShowStatusText(true);

      // Clear previous timer if exists
      if (statusTextTimerRef.current) {
        clearTimeout(statusTextTimerRef.current);
      }

      // Hide status text after 3 seconds
      statusTextTimerRef.current = setTimeout(() => {
        setShowStatusText(false);
      }, 3000);
    }

    return () => {
      if (statusTextTimerRef.current) {
        clearTimeout(statusTextTimerRef.current);
      }
    };
  }, [codeAvailability]);

  // Trigger shake animation
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Filter phone field to only accept numeric input
    let filteredValue = value;
    if (name === "phone") {
      filteredValue = value.replace(/\D/g, ""); // Remove all non-digit characters
    }

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSubmitError("");

    // Check email availability with debounce
    if (name === "email") {
      setEmailAvailability(null);

      // Clear previous timer
      if (emailDebounceTimer) {
        clearTimeout(emailDebounceTimer);
      }

      // Set email availability to checking if valid email format
      if (filteredValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(filteredValue)) {
        setEmailAvailability("checking");

        // Debounce the API call
        const timer = setTimeout(() => {
          checkEmailAvailability(filteredValue).catch((error) => {
            console.error("Unhandled error in checkEmailAvailability:", error);
            setEmailAvailability(null);
          });
        }, 500);

        setEmailDebounceTimer(timer);
      }
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => new Set(prev).add(fieldName));
    validateField(fieldName, formData[fieldName as keyof FormData]);

    // Check email availability on blur
    if (fieldName === "email" && formData.email) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setEmailAvailability("checking");
        checkEmailAvailability(formData.email).catch(() => {
          setEmailAvailability(null);
        });
      }
    }
  };

  const validateField = (fieldName: string, value: any) => {
    let error: string | undefined;

    switch (fieldName) {
      case "name":
        if (!value || value.trim().length === 0) {
          error = "กรุณากรอกชื่อ-นามสกุล";
        }
        break;
      case "email":
        if (!value || value.trim().length === 0) {
          error = "กรุณากรอกอีเมล";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "รูปแบบอีเมลไม่ถูกต้อง";
        }
        break;
      case "phone":
        if (!value || value.trim().length === 0) {
          error = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (value.length < 9) {
          error = "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก";
        } else if (value.length > 10) {
          error = "เบอร์โทรศัพท์ต้องไม่เกิน 10 หลัก";
        }
        break;
      case "affiliateCode":
        if (!value || value.trim().length === 0) {
          error = "กรุณากรอก Affiliate Code";
        } else if (!/^[A-Z0-9]+$/.test(value)) {
          error = "ใช้ได้เฉพาะตัวอักษร A-Z และตัวเลข 0-9";
        } else if (value.length < 3) {
          error = "รหัสต้องมีอย่างน้อย 3 ตัวอักษร";
        } else if (value.length > 10) {
          error = "รหัสต้องไม่เกิน 10 ตัวอักษร";
        }
        break;
      case "pdpaConsent":
        if (!value) {
          error = "กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: error }));
    return !error;
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate all required fields
    ["name", "email", "phone", "affiliateCode", "pdpaConsent"].forEach(
      (field) => {
        if (!validateField(field, formData[field as keyof FormData])) {
          isValid = false;
        }
      }
    );

    // Mark all fields as touched
    setTouched(
      new Set(["name", "email", "phone", "affiliateCode", "pdpaConsent"])
    );

    return isValid;
  };

  // Validate only Step 1 fields (Name, Email, Phone)
  const validateStep1 = (): boolean => {
    let isValid = true;

    ["name", "email", "phone"].forEach((field) => {
      if (!validateField(field, formData[field as keyof FormData])) {
        isValid = false;
      }
    });

    // Mark Step 1 fields as touched
    setTouched((prev) => new Set([...prev, "name", "email", "phone"]));

    return isValid;
  };

  // Generate affiliate code from name and phone
  const generateAffiliateCode = (name: string, phone: string): string => {
    // Extract first 3 letters of the name (uppercase)
    // Check if name contains English letters
    const englishLetters = name.match(/[A-Za-z]/g);
    let prefix: string;

    if (englishLetters && englishLetters.length >= 3) {
      // Use first 3 English letters from the name
      prefix = englishLetters.slice(0, 3).join("").toUpperCase();
    } else {
      // Default to "AIYA" if name is not English or has less than 3 letters
      prefix = "AIYA";
    }

    // Get last 4 digits of phone number
    const phoneDigits = phone.replace(/\D/g, "");
    const suffix = phoneDigits.slice(-4);

    return prefix + suffix;
  };

  // Handle Next button click (Step 1 -> Step 2)
  const handleNextStep = async () => {
    if (!validateStep1()) {
      scrollToError();
      return;
    }

    // Check if email is already taken
    if (formData.email) {
      const emailTaken = await checkEmailAvailability(formData.email);
      if (emailTaken) {
        setErrors((prev) => ({
          ...prev,
          email: "อีเมลนี้ถูกลงทะเบียนแล้ว",
        }));
        scrollToError();
        return;
      }
    }

    // Auto-generate affiliate code if empty with Smart Auto-Retry
    if (!formData.affiliateCode.trim()) {
      const baseCode = generateAffiliateCode(formData.name, formData.phone);
      let finalCode = baseCode;
      let isAvailable = false;

      // Smart retry: Check availability and auto-append number if taken (max 6 attempts: 0-5)
      for (let attempt = 0; attempt <= 5; attempt++) {
        const codeToCheck = attempt === 0 ? baseCode : `${baseCode}${attempt}`;
        const isTaken = await checkCodeAvailability(codeToCheck);

        if (!isTaken) {
          // Found an available code!
          finalCode = codeToCheck;
          isAvailable = true;
          break;
        }
      }

      // Set the final code (either available or last attempt)
      setFormData((prev) => ({ ...prev, affiliateCode: finalCode }));

      // If couldn't find available code after all attempts, set to null for manual editing
      if (!isAvailable) {
        setCodeAvailability(null);
      }
      // Note: checkCodeAvailability already sets availability state when code is found

      // Clear any previous errors for affiliateCode
      setErrors((prev) => ({ ...prev, affiliateCode: undefined }));

      // Remove affiliateCode from touched set to prevent validation errors
      setTouched((prev) => {
        const newTouched = new Set(prev);
        newTouched.delete("affiliateCode");
        return newTouched;
      });
    } else {
      // User kept existing code - validate it immediately
      setCodeAvailability("checking");
      await checkCodeAvailability(formData.affiliateCode);
    }

    setCurrentStep(2);
  };

  // Handle Back button click (Step 2 -> Step 1)
  const handleBackStep = () => {
    // Reset code availability state to give user a clean slate
    // but preserve the affiliate code they entered
    setCodeAvailability(null);

    // Clear any errors for affiliate code
    setErrors((prev) => ({ ...prev, affiliateCode: undefined }));

    setCurrentStep(1);

    // Scroll to the form smoothly after state update
    setTimeout(() => {
      if (formRef.current) {
        const formBottom = formRef.current.getBoundingClientRect().bottom;
        const viewportHeight = window.innerHeight;

        // If form bottom is not visible, scroll to make it visible
        if (formBottom > viewportHeight) {
          formRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
          // Otherwise scroll to top of form
          formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 100);
  };

  const checkCodeAvailability = async (code: string): Promise<boolean> => {
    if (!code || code.length < 3) {
      setCodeAvailability(null);
      setIsLongLoading(false);
      return false;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous long loading timer
    if (longLoadingTimerRef.current) {
      clearTimeout(longLoadingTimerRef.current);
      setIsLongLoading(false);
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set timeout to show long loading message after 3 seconds
    longLoadingTimerRef.current = setTimeout(() => {
      setIsLongLoading(true);
    }, 3000);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(
        `${apiUrl}/api/check-affiliate?affiliateCode=${code}`,
        { signal: abortController.signal }
      );
      const data = await response.json();

      const isTaken = data.exists;
      setCodeAvailability(isTaken ? "taken" : "available");

      // Clear long loading timer and state on success
      if (longLoadingTimerRef.current) {
        clearTimeout(longLoadingTimerRef.current);
        longLoadingTimerRef.current = null;
      }
      setIsLongLoading(false);

      return isTaken;
    } catch (error: any) {
      // Ignore abort errors (these are intentional cancellations)
      if (error.name === "AbortError") {
        return false;
      }

      setCodeAvailability(null);

      // Clear long loading timer and state on error
      if (longLoadingTimerRef.current) {
        clearTimeout(longLoadingTimerRef.current);
        longLoadingTimerRef.current = null;
      }
      setIsLongLoading(false);

      return false;
    }
  };

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
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
    } catch (error: any) {
      console.error("Error checking email availability:", error);
      setEmailAvailability(null);
      return false;
    }
  };

  const handleAffiliateCodeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, "");
    setFormData((prev) => ({ ...prev, affiliateCode: value }));

    if (errors.affiliateCode) {
      setErrors((prev) => ({ ...prev, affiliateCode: undefined }));
    }
    setSubmitError("");

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set code availability to checking
    if (value.length >= 3) {
      setCodeAvailability("checking");

      // Debounce the API call
      const timer = setTimeout(() => {
        checkCodeAvailability(value).catch((error) => {
          console.error("Unhandled error in checkCodeAvailability:", error);
          setCodeAvailability(null);
        });
      }, 500);

      setDebounceTimer(timer);
    } else {
      setCodeAvailability(null);
    }
  };

  const handleAffiliateCodeBlur = () => {
    handleBlur("affiliateCode");
    if (formData.affiliateCode.length >= 3) {
      checkCodeAvailability(formData.affiliateCode).catch(() => {
        setCodeAvailability(null);
      });
    }
  };

  const scrollToError = () => {
    setTimeout(() => {
      const firstError = formRef.current?.querySelector(".error-message");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Handle Enter key to navigate to next field
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    nextRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      triggerShake();
      scrollToError();
      return;
    }

    // Always perform final availability check to prevent race conditions (TOCTOU)
    // Even if the code was "available" during real-time validation, another user
    // could have registered it between then and now
    if (formData.affiliateCode) {
      const isTaken = await checkCodeAvailability(formData.affiliateCode);

      if (isTaken) {
        triggerShake();
        scrollToError();
        return;
      }
    }

    setIsLoading(true);
    setSubmitError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";

      // ========================================
      // STEP 1: บันทึกลง Event Registration DB (เก็บข้อมูลไว้ที่ฉัน)
      // ========================================
      const eventDbResponse = await fetch(`${apiUrl}/api/register-affiliate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lineUserId: profile?.userId, // Add LINE User ID if available
        }),
      });

      // Safely parse JSON response - handle cases where server returns non-JSON
      let eventDbData: any;
      try {
        eventDbData = await eventDbResponse.json();
      } catch (parseError) {
        if (!eventDbResponse.ok) {
          throw new Error(
            `การลงทะเบียนล้มเหลว (Status: ${eventDbResponse.status})`
          );
        }
        throw new Error("การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง");
      }

      if (!eventDbResponse.ok) {
        // Handle 409 Conflict (duplicate data)
        if (eventDbResponse.status === 409 && eventDbData.field) {
          setErrors((prev) => ({
            ...prev,
            [eventDbData.field]: eventDbData.message,
          }));
          setTouched((prev) => new Set(prev).add(eventDbData.field));
          throw new Error(eventDbData.message);
        }

        throw new Error(
          eventDbData.message || "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง"
        );
      }

      // ========================================
      // STEP 2: ยิงไปที่ Main System DB (ให้ affiliate code ใช้งานได้จริง)
      // ========================================
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
              tel: formData.phone, // แปลง phone -> tel
              generatedCode: formData.affiliateCode, // แปลง affiliateCode -> generatedCode
            }),
          }
        );

        // Safely parse JSON response
        let mainSystemData: any = null;
        try {
          mainSystemData = await mainSystemResponse.json();
        } catch (parseError) {
          mainSystemSuccess = false;
        }

        if (mainSystemData && !mainSystemResponse.ok) {
          mainSystemSuccess = false;
          // ไม่ throw error เพราะข้อมูลถูกบันทึกที่ event DB แล้ว
          // แจ้งเตือนแต่ให้ดำเนินการต่อ
        } else {
          mainSystemSuccess = true;
        }
      } catch (mainSystemError) {
        mainSystemSuccess = false;
        // ไม่ throw error เพราะข้อมูลถูกบันทึกที่ event DB แล้ว
      }

      // ========================================
      // STEP 3: Navigate to Thank You page
      // ========================================
      // Check email status and pass it to thank-you page
      const emailSent = eventDbData.emailSent ?? true; // Default to true for backward compatibility

      navigate("/thank-you", {
        state: {
          name: formData.name,
          affiliateCode: formData.affiliateCode,
          emailSent: emailSent,
          mainSystemSuccess: mainSystemSuccess,
        },
      });
    } catch (err: any) {
      setSubmitError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      scrollToError();
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (fieldName: string) => {
    return touched.has(fieldName) && errors[fieldName as keyof FormErrors];
  };

  // Show loading spinner while LIFF is initializing
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-aiya-purple mb-4"></div>
          <p className="text-white/70 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto relative z-10 animate-fade-in">
        {/* Event Info Card */}
        <div className="mb-6 md:mb-8">
          {/* Banner Image */}
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/aff-banner.png"
              alt="มาเป็นพันธิมิตรกับเรา"
              className="w-full h-auto object-cover aspect-[3/2]"
            />
          </div>

          {/* Hero/Banner Content - Premium Mobile-First Design */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="text-center space-y-5 md:space-y-6">
              {/* SECTION 1: The Hook - Gradient & Impact */}
              <div className="space-y-3 md:space-y-4">
                {/* Headline with Gradient on AI Empire only */}
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-relaxed text-white py-2">
                  🚀 โอกาสทอง!{" "}
                  <span className="inline-block mt-1 md:mt-0">
                    ร่วมเป็นส่วนหนึ่งของ{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 whitespace-nowrap">
                      AI EMPIRE
                    </span>
                  </span>
                </h2>

                {/* Sub-headline */}
                <p className="text-white text-base sm:text-lg md:text-xl font-medium">
                  สัมผัสประสบการณ์ความคุ้มแบบ WIN - WIN
                </p>

                {/* Quote */}
                <p className="text-gray-300 text-sm sm:text-base md:text-lg italic">
                  " คนบอกต่อได้ค่าคอม คนสมัครได้ส่วนลด "
                </p>
              </div>

              {/* SECTION 2: Benefits - Icons & Highlights with Glassmorphism */}
              <div className="mt-6 md:mt-8 bg-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-6 md:p-8 space-y-5 md:space-y-6 shadow-xl border border-white/10">
                {/* Benefit A: Commission */}
                <div className="flex items-start gap-4 text-left">
                  {/* Icon: Hand with Money */}
                  <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-green-400/20 to-amber-400/20 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed">
                      สร้างรายได้เสริมง่ายๆ แค่บอกต่อ!{" "}
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-green-500 text-lg sm:text-xl md:text-2xl block mt-1">
                        รับค่าคอมมิชชั่นสูงสุด{" "}
                        <span className="whitespace-nowrap">7,000 บาท</span>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Benefit B: Knowledge/Customer Discount */}
                <div className="flex items-start gap-4 text-left">
                  {/* Icon: Gift/Discount */}
                  <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                      />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed">
                      รับความรู้ AI ต่อยอดธุรกิจให้สำเร็จ{" "}
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-lg sm:text-xl md:text-2xl block mt-1">
                        ลูกค้ารับส่วนลดสูงสุด{" "}
                        <span className="whitespace-nowrap">2,000 บาท</span>
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LINE Login Button - Only show in LINE client (LIFF) */}
        {isReady && isInClient && !isLoggedIn && (
          <button
            onClick={login}
            className="mb-4 md:mb-6 w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34b] text-white font-medium px-4 py-2.5 md:py-3 rounded-lg transition-colors duration-200 text-sm md:text-base"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </button>
        )}

        {/* LINE Profile Display - Only show in LINE client (LIFF) */}
        {isReady && isInClient && isLoggedIn && profile && (
          <div className="mb-6 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-lg backdrop-blur-md relative overflow-hidden">
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-aiya-purple/10 blur-[40px] rounded-full pointer-events-none"></div>

            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.pictureUrl ? (
                <img
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  className="w-14 h-14 rounded-full border-2 border-white/20 shadow-md object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aiya-purple to-aiya-navy flex items-center justify-center text-white text-xl font-bold border-2 border-white/20">
                  {profile.displayName?.charAt(0)}
                </div>
              )}
              {/* LINE Status Indicator (Green dot) */}
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#06C755] border-2 border-[#020c17] rounded-full"></div>
            </div>

            {/* Text Info */}
            <div className="flex-1 min-w-0 z-10">
              <p className="text-xs text-gray-400 font-medium mb-0.5">
                เข้าสู่ระบบโดย
              </p>
              <h3 className="text-white text-lg font-bold truncate tracking-tight leading-tight">
                {profile.displayName}
              </h3>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="glass-card p-5 sm:p-6 md:p-8 lg:p-10 space-y-5 md:space-y-6"
          noValidate
        >
          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-4">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    currentStep >= 1
                      ? "bg-gradient-to-br from-aiya-purple to-[#5C499D] text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {currentStep > 1 ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    "1"
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    currentStep === 1 ? "text-white" : "text-white/60"
                  }`}
                >
                  ข้อมูลส่วนตัว
                </span>
              </div>

              {/* Connector Line */}
              <div
                className={`w-12 h-0.5 transition-colors duration-300 ${
                  currentStep >= 2 ? "bg-aiya-purple" : "bg-white/20"
                }`}
              ></div>

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    currentStep >= 2
                      ? "bg-gradient-to-br from-aiya-purple to-[#5C499D] text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    currentStep === 2 ? "text-white" : "text-white/60"
                  }`}
                >
                  สร้างรหัส
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 md:mb-4">
            {currentStep === 1 ? "กรอกข้อมูลส่วนตัว" : "รหัส Affiliate ของคุณ"}
          </h2>

          {/* Global Error */}
          {submitError && (
            <div className="error-message bg-red-500/20 border border-red-400/50 text-red-300 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3 text-sm md:text-base animate-fade-in">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-red-400 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          {/* ==================== STEP 1: Personal Information ==================== */}
          {currentStep === 1 && (
            <div className="animate-slide-in-left">
              {/* Personal Information - Single Grid Container for Consistent Spacing */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* ชื่อ-นามสกุล */}
                <div>
                  <label className="label-modern">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur("name")}
                    onKeyDown={(e) => handleKeyDown(e, emailRef)}
                    enterKeyHint="next"
                    className={`input-modern ${
                      showError("name") ? "ring-2 ring-red-400/50" : ""
                    }`}
                    placeholder="Somchai Jaidee"
                  />
                  {showError("name") && (
                    <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="label-modern">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={emailRef}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                      enterKeyHint="next"
                      className={`input-modern ${
                        showError("email") || emailAvailability === "taken"
                          ? "ring-2 ring-red-400/50"
                          : emailAvailability === "available"
                          ? "ring-2 ring-green-400/50"
                          : ""
                      }`}
                      placeholder="example@email.com"
                    />
                    {/* Email Status Indicator */}
                    {emailAvailability && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {emailAvailability === "checking" && (
                          <svg
                            className="animate-spin h-5 w-5 text-white/50"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        {emailAvailability === "available" && (
                          <svg
                            className="w-5 h-5 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {emailAvailability === "taken" && (
                          <svg
                            className="w-5 h-5 text-red-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {emailAvailability === "taken" && !showError("email") && (
                    <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      อีเมลนี้ถูกลงทะเบียนแล้ว
                    </p>
                  )}
                  {showError("email") && (
                    <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone - Full Width on Desktop */}
                <div className="lg:col-span-2">
                  <label className="label-modern">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur("phone")}
                    enterKeyHint="done"
                    maxLength={10}
                    className={`input-modern ${
                      showError("phone") ? "ring-2 ring-red-400/50" : ""
                    }`}
                    placeholder="08x-xxx-xxxx"
                    inputMode="numeric"
                  />
                  {showError("phone") && (
                    <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-gradient mt-5 min-h-[48px] md:min-h-[56px] text-base md:text-lg group"
              >
                <span>ถัดไป</span>
                <svg
                  className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* ==================== STEP 2: Affiliate Code & Confirmation ==================== */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5 animate-slide-in-right">
              {/* Affiliate Code - Prominent Display */}
              <div className="text-center">
                <div className="relative max-w-md mx-auto">
                  <input
                    ref={affiliateCodeRef}
                    type="text"
                    name="affiliateCode"
                    value={formData.affiliateCode}
                    onChange={handleAffiliateCodeChange}
                    onBlur={handleAffiliateCodeBlur}
                    enterKeyHint="done"
                    maxLength={10}
                    inputMode="text"
                    lang="en"
                    spellCheck="false"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    className={`input-modern font-mono font-bold tracking-widest text-3xl md:text-4xl text-center py-5 md:py-6 px-12 transition-all duration-200 focus:shadow-lg focus:shadow-aiya-purple/20 border-2 bg-white/5 ${
                      showError("affiliateCode")
                        ? "border-red-400/50 ring-2 ring-red-400/50"
                        : codeAvailability === "available"
                        ? "border-green-400/50 ring-2 ring-green-400/50"
                        : codeAvailability === "taken"
                        ? "border-red-400/50 ring-2 ring-red-400/50"
                        : "border-aiya-purple/60 focus:border-aiya-purple"
                    } ${isShaking ? "animate-shake" : ""}`}
                    placeholder="AIYABOY"
                    style={{
                      caretColor: "#a78bfa",
                    }}
                  />
                  {/* Status/Edit Indicator - Always visible on right side */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {/* Loading State */}
                    {codeAvailability === "checking" && (
                      <svg
                        className="animate-spin h-6 w-6 text-white/50"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {/* Success State */}
                    {codeAvailability === "available" && (
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {/* Error State */}
                    {codeAvailability === "taken" && (
                      <svg
                        className="w-6 h-6 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {/* Default State - Pencil Icon (Editable Indicator) */}
                    {!codeAvailability && (
                      <svg
                        className="w-6 h-6 text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                {/* Long Loading Message - Show after 3 seconds of checking */}
                {codeAvailability === "checking" && isLongLoading && (
                  <p className="text-amber-400 text-sm mt-3 flex items-center justify-center gap-2 animate-fade-in">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    ระบบกำลังเริ่มต้นทำงาน อาจใช้เวลาสักครู่...
                  </p>
                )}
                {codeAvailability === "available" &&
                  !showError("affiliateCode") &&
                  showStatusText && (
                    <p className="text-green-300 text-sm mt-2 flex items-center justify-center gap-1 animate-fade-in">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      รหัสนี้ว่าง สามารถใช้งานได้
                    </p>
                  )}
                {codeAvailability === "taken" && showStatusText && (
                  <p className="error-message text-red-300 text-sm mt-2 flex items-center justify-center gap-1 animate-fade-in">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    รหัสนี้ถูกใช้งานแล้ว กรุณาเลือกรหัสอื่น
                  </p>
                )}
                {showError("affiliateCode") && (
                  <p className="error-message text-red-300 text-sm mt-2 flex items-center justify-center gap-1 animate-fade-in">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.affiliateCode}
                  </p>
                )}
              </div>

              {/* PDPA Consent Checkbox - De-emphasized Style */}
              <div>
                <label
                  htmlFor="pdpa-checkbox"
                  className="flex items-start gap-2 cursor-pointer select-none"
                >
                  <div className="relative shrink-0 mt-0.5">
                    <input
                      id="pdpa-checkbox"
                      name="pdpaConsent"
                      type="checkbox"
                      checked={formData.pdpaConsent}
                      required
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          pdpaConsent: e.target.checked,
                        }));
                        if (errors.pdpaConsent) {
                          setErrors((prev) => ({
                            ...prev,
                            pdpaConsent: undefined,
                          }));
                        }
                        setSubmitError("");
                      }}
                      onBlur={() => handleBlur("pdpaConsent")}
                      className="peer sr-only"
                      aria-label="ยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว"
                    />
                    <div
                      className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                        formData.pdpaConsent
                          ? "border-aiya-purple bg-aiya-purple"
                          : showError("pdpaConsent")
                          ? "border-red-400 bg-transparent"
                          : "border-white/20 bg-transparent peer-hover:border-white/30"
                      }`}
                    >
                      {formData.pdpaConsent && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/50 leading-snug">
                    ข้าพเจ้ายอมรับ{" "}
                    <a
                      href="https://web.aiya.ai/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-white/50 hover:text-white/70 transition-colors"
                    >
                      เงื่อนไขการใช้งาน
                    </a>{" "}
                    และ{" "}
                    <a
                      href="https://web.aiya.ai/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-white/50 hover:text-white/70 transition-colors"
                    >
                      นโยบายความเป็นส่วนตัว
                    </a>{" "}
                    ของ AIYA <span className="text-red-400/70">*</span>
                  </span>
                </label>
              </div>

              {/* Action Buttons - Back and Submit */}
              <div className="flex flex-row gap-3 items-stretch">
                {/* Back Button - Icon Only (Small Square) */}
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="flex items-center justify-center w-12 md:w-14 min-h-[48px] md:min-h-[56px] rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 shrink-0"
                  aria-label="ย้อนกลับ"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Submit Button - Takes remaining space */}
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    codeAvailability === "taken" ||
                    !formData.pdpaConsent
                  }
                  className={`flex-1 btn-gradient disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] md:min-h-[56px] text-base md:text-lg ${
                    codeAvailability === "available" && !isLoading
                      ? "animate-glow-pulse"
                      : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 md:h-6 md:w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    "ยืนยันการสมัคร"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <p className="text-xs md:text-sm text-white/60 text-center mt-3 md:mt-4 flex items-center justify-center gap-1.5">
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย</span>
          </p>
        </form>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs md:text-sm mt-6 md:mt-8">
          © 2025 MeGenius Company Limited. All rights reserved
        </p>
      </div>
    </div>
  );
}
