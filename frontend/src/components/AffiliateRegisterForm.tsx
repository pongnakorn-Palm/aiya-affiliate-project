import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLiff } from "../contexts/LiffContext";
import OnboardingFlow from "./registration/OnboardingFlow";
import RegistrationFlow from "./registration/RegistrationFlow";

type Phase = "onboarding" | "registration";

export default function AffiliateRegisterForm() {
  const navigate = useNavigate();
  const { isLoggedIn, profile, login, isReady, isInClient } = useLiff();
  const [phase, setPhase] = useState<Phase>("onboarding");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);

  // Check if user is already registered and redirect to dashboard
  // Skip redirect if ?test=true is in URL (for development testing)
  useEffect(() => {
    const checkExistingAffiliate = async () => {
      // Allow bypassing redirect for testing
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("test") === "true") {
        if (import.meta.env.DEV) {
          console.log("[DEV] Test mode enabled - skipping redirect check");
        }
        setIsCheckingRegistration(false);
        return;
      }

      if (isLoggedIn && profile?.userId) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "";
          const response = await fetch(
            `${apiUrl}/api/affiliate/dashboard/${profile.userId}`
          );

          if (response.ok) {
            // User is already registered, redirect to portal
            navigate("/portal", { replace: true });
            // Keep loading state true to prevent flicker
            return;
          }
        } catch (error) {
          // User not registered yet - continue to registration form
        }
      }

      // Only set to false if not redirecting
      setIsCheckingRegistration(false);
    };

    checkExistingAffiliate();
  }, [isLoggedIn, profile?.userId, navigate]);

  // Check localStorage for onboarding completion
  useEffect(() => {
    const completed = localStorage.getItem("aiya_onboarding_completed");
    if (completed === "true") {
      setHasCompletedOnboarding(true);
      setPhase("registration");
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("aiya_onboarding_completed", "true");
    setHasCompletedOnboarding(true);
    setPhase("registration");
  };

  const handleBackToOnboarding = () => {
    setPhase("onboarding");
  };

  // Show loading spinner while LIFF is initializing or checking registration
  if (!isReady || isCheckingRegistration) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-aiya-navy relative overflow-hidden">
        {/* AIYA Brand Ambient Lighting */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-aiya-purple/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-aiya-lavender/8 via-transparent to-transparent blur-3xl pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-3 border-aiya-lavender/20 border-t-aiya-lavender mb-4"></div>
          <p className="text-white/70 text-sm font-medium">
            {!isReady ? "กำลังโหลด..." : "กำลังตรวจสอบข้อมูล..."}
          </p>
        </div>
      </div>
    );
  }

  // Onboarding Phase
  if (phase === "onboarding" && !hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Registration Phase
  return (
    <div className="min-h-[100dvh] bg-[#0F1216]">
      {/* LINE Login Prompt (if not logged in and in LIFF) */}
      {isReady && isInClient && !isLoggedIn && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-[#0F1216]/95 backdrop-blur-sm border-b border-white/5">
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34b] text-white font-semibold px-4 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE เพื่อกรอกข้อมูลอัตโนมัติ
          </button>
        </div>
      )}

      {/* LINE Profile Badge (if logged in) */}
      {isReady && isInClient && isLoggedIn && profile && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-12 pb-4 bg-[#0F1216]/95 backdrop-blur-sm border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              {profile.pictureUrl ? (
                <img
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  className="w-10 h-10 rounded-full border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                  {profile.displayName?.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#06C755] border-2 border-[#0F1216] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/50">เข้าสู่ระบบโดย</p>
              <p className="text-sm font-semibold text-white truncate">
                {profile.displayName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <div className={isInClient && isLoggedIn ? "pt-24" : isInClient ? "pt-20" : ""}>
        <RegistrationFlow
          initialData={{
            name: profile?.displayName || "",
            email: profile?.email || "",
          }}
          lineUserId={profile?.userId}
          isLineLoggedIn={isLoggedIn}
          onBack={hasCompletedOnboarding ? undefined : handleBackToOnboarding}
        />
      </div>
    </div>
  );
}
