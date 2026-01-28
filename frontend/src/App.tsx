import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';

const AffiliateRegisterForm = lazy(() => import('./components/AffiliateRegisterForm'));
const ThankYou = lazy(() => import('./components/ThankYou'));
const PartnerPortal = lazy(() => import('./components/PartnerPortal'));

const RouteLoadingFallback = () => (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F1216]">
        <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-white/70 text-sm">กำลังโหลด...</p>
        </div>
    </div>
);

export default function App() {
    const location = useLocation();

    return (
        <Suspense fallback={<RouteLoadingFallback />}>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <PageTransition>
                        <AffiliateRegisterForm />
                    </PageTransition>
                } />
                <Route path="/register" element={
                    <PageTransition>
                        <AffiliateRegisterForm />
                    </PageTransition>
                } />
                <Route path="/thank-you" element={
                    <PageTransition>
                        <ThankYou />
                    </PageTransition>
                } />
                <Route
                    path="/portal"
                    element={
                        <ErrorBoundary>
                            <PageTransition>
                                <PartnerPortal />
                            </PageTransition>
                        </ErrorBoundary>
                    }
                />
            </Routes>
        </Suspense>
    );
}
