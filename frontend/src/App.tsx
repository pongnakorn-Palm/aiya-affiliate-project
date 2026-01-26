import { Routes, Route, useLocation } from 'react-router-dom';
import AffiliateRegisterForm from './components/AffiliateRegisterForm';
import ThankYou from './components/ThankYou';
import PartnerPortal from './components/PartnerPortal';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';

export default function App() {
    const location = useLocation();

    return (
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
    );
}
