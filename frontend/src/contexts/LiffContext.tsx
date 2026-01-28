import React, { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";

interface UserProfile {
  displayName: string;
  pictureUrl?: string;
  userId: string;
  email?: string;
}

interface LiffContextType {
  liffObject: typeof liff | null;
  isLoggedIn: boolean;
  isReady: boolean;
  isInClient: boolean;
  profile: UserProfile | null;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        // Validate LIFF ID is configured
        const liffId = import.meta.env.VITE_LIFF_ID;
        const useMockMode = import.meta.env.VITE_USE_MOCK_LIFF === 'true';

        // Development Mode: Use mock profile
        if (useMockMode) {
          if (import.meta.env.DEV) {
            console.log("🔧 Development Mode: Using mock LIFF profile");
          }
          setIsMockMode(true);
          setIsReady(true);
          setIsLoggedIn(true);
          setIsInClient(false);

          // Mock profile for testing (use real LINE ID for dev)
          setProfile({
            displayName: "Test User",
            pictureUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser&backgroundColor=b6e3f4",
            userId: "U0953dec98859a88b40a1e232b78b4c7d", // Your actual LINE ID
            email: "test@example.com",
          });

          return;
        }

        if (!liffId || liffId.trim() === '') {
          throw new Error('VITE_LIFF_ID environment variable is not set');
        }

        await liff.init({
          liffId: liffId,
        });

        setIsReady(true);

        // Check if running in LINE client (LIFF browser)
        const inClient = liff.isInClient();
        setIsInClient(inClient);

        // ถ้า Login สำเร็จ (ทั้งใน LINE หรือ External Browser ที่ Login แล้ว)
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          try {
            const userProfile = await liff.getProfile();
            const decodedIDToken = liff.getDecodedIDToken();

            if (import.meta.env.DEV) {
              console.log("LIFF Profile:", userProfile);
            }

            setProfile({
              displayName: userProfile.displayName,
              pictureUrl: userProfile.pictureUrl,
              userId: userProfile.userId,
              email: decodedIDToken?.email,
            });
          } catch (profileError) {
            console.error("Error getting profile:", profileError);
          }
        }
        // ❌ ลบ else if (inClient) ออก เพื่อป้องกัน Redirect Loop
      } catch (err: any) {
        console.error("LIFF Init Failed", err);
        setError(err.message || "LIFF Initialization failed");
        setIsReady(true);
      }
    };

    initLiff();
  }, []);

  const login = () => {
    if (!isLoggedIn) {
      // สั่ง Login เฉพาะตอนกดปุ่มจริงๆ (สำหรับ External Browser)
      liff.login({ redirectUri: window.location.href });
    }
  };

  const logout = () => {
    if (isLoggedIn) {
      // Only call liff.logout() if not in mock mode
      if (!isMockMode) {
        liff.logout();
      }
      setIsLoggedIn(false);
      setProfile(null);
      window.location.href = "/register";
    }
  };

  return (
    <LiffContext.Provider
      value={{
        liffObject: liff,
        isLoggedIn,
        isReady,
        isInClient,
        profile,
        error,
        login,
        logout,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
};

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (context === undefined) {
    throw new Error("useLiff must be used within a LiffProvider");
  }
  return context;
};
