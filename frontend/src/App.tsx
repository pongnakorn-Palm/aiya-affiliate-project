import { Routes, Route } from 'react-router-dom';
import AffiliateRegisterForm from './components/AffiliateRegisterForm';
import ThankYou from './components/ThankYou';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<AffiliateRegisterForm />} />
            <Route path="/register" element={<AffiliateRegisterForm />} />
            <Route path="/thank-you" element={<ThankYou />} />
        </Routes>
    );
}
