import React, { createContext, useContext, useEffect, useState } from 'react';
import liff from '@line/liff';

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

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isReady, setIsReady] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInClient, setIsInClient] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initLiff = async () => {
            try {
                await liff.init({ liffId: import.meta.env.VITE_LIFF_ID || '2008879589-q6KUIrLg' });

                setIsReady(true);

                // Check if running in LINE client (LIFF browser)
                const inClient = liff.isInClient();
                setIsInClient(inClient);

                if (liff.isLoggedIn()) {
                    setIsLoggedIn(true);
                    const userProfile = await liff.getProfile();
                    const decodedIDToken = liff.getDecodedIDToken();

                    setProfile({
                        displayName: userProfile.displayName,
                        pictureUrl: userProfile.pictureUrl,
                        userId: userProfile.userId,
                        email: decodedIDToken?.email
                    });
                } else if (inClient) {
                    // Auto login if in LINE client but not logged in
                    liff.login();
                }
            } catch (err: any) {
                console.error('LIFF Init Failed', err);
                setError(err.message || 'LIFF Initialization failed');
                setIsReady(true);
            }
        };

        initLiff();
    }, []);

    const login = () => {
        if (!isLoggedIn) {
            liff.login();
        }
    };

    const logout = () => {
        if (isLoggedIn) {
            liff.logout();
            setIsLoggedIn(false);
            setProfile(null);
            window.location.reload();
        }
    };

    return (
        <LiffContext.Provider value={{
            liffObject: liff,
            isLoggedIn,
            isReady,
            isInClient,
            profile,
            error,
            login,
            logout
        }}>
            {children}
        </LiffContext.Provider>
    );
};

export const useLiff = () => {
    const context = useContext(LiffContext);
    if (context === undefined) {
        throw new Error('useLiff must be used within a LiffProvider');
    }
    return context;
};
