import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLiff } from "../contexts/LiffContext";
import OnboardingFlow from "./registration/OnboardingFlow";
import RegistrationFlow from "./registration/RegistrationFlow";

type Phase = "onboarding" | "registration";

export default function AffiliateRegisterForm() {
  const navigate = useNavigate();
  const { isLoggedIn, profile, isReady } = useLiff();
  const [phase, setPhase] = useState<Phase>("onboarding");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage for onboarding completion (sync, before render)
  useEffect(() => {
    const completed = localStorage.getItem("aiya_onboarding_completed");
    if (completed === "true") {
      setHasCompletedOnboarding(true);
      setPhase("registration");
    }
  }, []);

  // Check if user is already registered and redirect to dashboard
  // Only run when LIFF is ready
  useEffect(() => {
    // Wait for LIFF to be ready
    if (!isReady) return;

    const abortController = new AbortController();

    const checkExistingAffiliate = async () => {
      // Allow bypassing redirect for testing
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("test") === "true") {
        if (import.meta.env.DEV) {
          console.log("[DEV] Test mode enabled - skipping redirect check");
        }
        setIsInitialized(true);
        return;
      }

      // Only check if logged in with profile
      if (isLoggedIn && profile?.userId) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "";
          const response = await fetch(
            `${apiUrl}/api/affiliate/dashboard/${profile.userId}`,
            { signal: abortController.signal }
          );

          if (response.ok) {
            // User is already registered, redirect to portal
            navigate("/portal", { replace: true });
            // Don't set isInitialized - keep loading to prevent flicker
            return;
          }

          // 404 means user not registered - continue to registration form
          if (response.status !== 404) {
            console.error(`[AffiliateRegisterForm] Unexpected API response: ${response.status}`);
          }
        } catch (err) {
          // Ignore abort errors (component unmounted)
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          console.error("[AffiliateRegisterForm] Error checking registration:", err);
          setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
        }
      }

      // Done checking - allow render
      if (!abortController.signal.aborted) {
        setIsInitialized(true);
      }
    };

    checkExistingAffiliate();

    return () => {
      abortController.abort();
    };
  }, [isReady, isLoggedIn, profile?.userId, navigate]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("aiya_onboarding_completed", "true");
    setHasCompletedOnboarding(true);
    setPhase("registration");
  };

  const handleBackToOnboarding = () => {
    setPhase("onboarding");
  };

  // Show loading spinner while LIFF is initializing or checking registration
  // Must wait for both isReady AND isInitialized to prevent flicker
  if (!isReady || !isInitialized) {
    const statusText = !isReady ? "กำลังโหลด..." : "กำลังตรวจสอบข้อมูล...";
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0F1216] relative overflow-hidden">
        {/* AIYA Brand Ambient Lighting */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-dark/10 via-transparent to-transparent pointer-events-none" />
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="text-center relative z-10" role="status" aria-live="polite">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-3 border-primary/20 border-t-primary mb-4"
            aria-hidden="true"
          />
          <p className="text-white/60 text-sm">{statusText}</p>
          <span className="sr-only">{statusText}</span>
        </div>
      </div>
    );
  }

  // Show error state if API check failed
  if (error) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0F1216] relative overflow-hidden">
        {/* AIYA Brand Ambient Lighting */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-dark/10 via-transparent to-transparent pointer-events-none" />
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="text-center relative z-10 px-6" role="alert">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white/80 text-base mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Onboarding Phase
  if (phase === "onboarding" && !hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Registration Phase - Full screen layout
  return (
    <RegistrationFlow
      initialData={{
        name: profile?.displayName || "",
        email: profile?.email || "",
      }}
      lineUserId={profile?.userId}
      isLineLoggedIn={isLoggedIn}
      lineProfile={isLoggedIn && profile ? {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      } : undefined}
      onBack={hasCompletedOnboarding ? undefined : handleBackToOnboarding}
    />
  );
}
