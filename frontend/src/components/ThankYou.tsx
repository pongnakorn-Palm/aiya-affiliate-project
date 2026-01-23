import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ThankYou() {
    const navigate = useNavigate();
    const location = useLocation();
    const [copied, setCopied] = useState(false);

    // Protected Route: Redirect if accessed directly without registration data
    const hasRegistered = !!location.state?.affiliateCode;

    useEffect(() => {
        if (!hasRegistered) {
            navigate('/', { replace: true });
        }
    }, [hasRegistered, navigate]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Early return if not registered - prevent rendering before redirect
    if (!hasRegistered) {
        return null;
    }

    // Get data from previous state
    const affiliateCode = location.state?.affiliateCode || '';
    const emailSent = location.state?.emailSent ?? true;
    const mainSystemSuccess = location.state?.mainSystemSuccess ?? true;

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(affiliateCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClose = () => {
        const isDesktop = window.innerWidth >= 1024;

        if (isDesktop) {
            window.location.href = 'https://web.aiya.ai/th/bootcamp/ai-empire/affiliate';
        } else {
            if (liff.isInClient()) {
                liff.closeWindow();
            } else {
                navigate('/');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#020c17] text-white font-[family-name:var(--font-line-seed)] relative overflow-hidden flex items-center justify-center p-4">

            {/* Background Glow Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-aiya-purple/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in">

                {/* Compact Success Icon */}
                <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-full h-full bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Compact Title */}
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                    ลงทะเบียนสำเร็จ! 🎉
                </h2>

                {/* Email Warning (if email failed to send) */}
                {!emailSent && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-yellow-200 font-semibold text-sm mb-1">
                                ⚠️ อีเมลยืนยันไม่สามารถส่งได้
                            </p>
                            <p className="text-yellow-300/80 text-xs">
                                กรุณาบันทึกรหัสพันธมิตรด้านล่างไว้
                            </p>
                        </div>
                    </div>
                )}

                {/* Main System Warning */}
                {!mainSystemSuccess && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-red-200 font-semibold text-sm mb-1">
                                ⚠️ รหัสพันธมิตรอาจยังไม่พร้อมใช้งาน
                            </p>
                            <p className="text-red-300/80 text-xs">
                                กรุณาติดต่อทีมงานเพื่อเปิดใช้งานรหัส: <span className="font-mono font-bold">{affiliateCode}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* HERO: Affiliate Code Display */}
                <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden backdrop-blur-sm mb-5">

                    {/* Copy Button - Top Right Corner */}
                    <button
                        onClick={handleCopyCode}
                        className="absolute top-4 right-4 p-2 h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 active:scale-95 group flex items-center justify-center"
                        title="Copy code"
                    >
                        {copied ? (
                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                    {/* Copied Notification */}
                    {copied && (
                        <span className="absolute top-12 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-fade-in">
                            คัดลอกแล้ว!
                        </span>
                    )}

                    <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">รหัสพันธมิตรของคุณ</p>
                        <p className="text-4xl font-bold text-white font-mono tracking-wider break-all text-center mb-2">{affiliateCode}</p>
                        <p className="text-sm text-gray-400">แชร์รหัสนี้เพื่อรับค่าคอมมิชชั่น</p>
                    </div>
                </div>

                {/* Important Next Steps - Single Card */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-5">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-xl">📋</span>
                        <span>ขั้นตอนต่อไป</span>
                    </h3>
                    <div className="space-y-3 text-sm text-white/90">
                        {/* Step 1 */}
                        <div className="flex items-start gap-3">
                            <span className="text-lg shrink-0">📧</span>
                            <p>เช็คอีเมลเพื่อดูคู่มือและรายละเอียด</p>
                        </div>

                        {/* Step 2 - Payment Info */}
                        <div className="flex items-start gap-3">
                            <span className="text-lg shrink-0">🏦</span>
                            <p>ทีมงานจะติดต่อขอเลขบัญชีเมื่อมียอดขาย</p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start gap-3">
                            <span className="text-lg shrink-0">🚀</span>
                            <p>แชร์รหัสให้เพื่อนได้ทันที!</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Primary CTA: Go to Dashboard */}
                    <button
                        onClick={() => navigate('/portal')}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#3A23B5] to-[#5C499D] text-white font-bold text-lg shadow-lg shadow-aiya-purple/20 hover:shadow-aiya-purple/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        ดูสถิติของฉัน
                    </button>

                    {/* Secondary: Close */}
                    <button
                        onClick={handleClose}
                        className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    >
                        ปิด
                    </button>
                </div>

            </div>
        </div>
    );
}
