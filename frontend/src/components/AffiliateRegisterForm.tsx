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
            `${apiUrl}/api/affiliate/dashboard/${profile.userId}`
          );

          if (response.ok) {
            // User is already registered, redirect to portal
            navigate("/portal", { replace: true });
            // Don't set isInitialized - keep loading to prevent flicker
            return;
          }
        } catch (error) {
          // User not registered yet - continue to registration form
        }
      }

      // Done checking - allow render
      setIsInitialized(true);
    };

    checkExistingAffiliate();
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
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0F1216] relative overflow-hidden">
        {/* AIYA Brand Ambient Lighting */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-dark/10 via-transparent to-transparent pointer-events-none" />
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-3 border-primary/20 border-t-primary mb-4" />
          <p className="text-white/60 text-sm">
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
