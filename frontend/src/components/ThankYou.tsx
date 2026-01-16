import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ThankYou() {
    const navigate = useNavigate();
    const location = useLocation();
    const [copied, setCopied] = useState(false);

    // Protected Route: Redirect if accessed directly without registration data
    const hasRegistered = !!location.state?.name;

    useEffect(() => {
        if (!hasRegistered) {
            navigate('/', { replace: true });
        }
    }, [hasRegistered, navigate]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Get data from previous state
    const name = location.state?.name || '';
    const affiliateCode = location.state?.affiliateCode || '';
    const emailSent = location.state?.emailSent ?? true; // Default to true for backward compatibility
    const mainSystemSuccess = location.state?.mainSystemSuccess ?? true; // Default to true for backward compatibility

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(affiliateCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClose = () => {
        // Check if device is desktop (width >= 1024px)
        const isDesktop = window.innerWidth >= 1024;

        if (isDesktop) {
            // Desktop: Redirect to affiliate website
            window.location.href = 'https://web.aiya.ai/th/bootcamp/ai-empire/affiliate';
        } else {
            // Mobile/Tablet: Close LIFF or navigate home
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

            <div className="relative z-10 w-full max-w-md md:max-w-2xl lg:max-w-3xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl animate-scale-in">

                {/* Success Icon */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 mx-auto mb-6 md:mb-8 relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-full h-full bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2.5 mb-6 md:mb-8">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300">
                        ลงทะเบียนสำเร็จ! 🎉
                    </h2>
                    <p className="text-gray-400 text-base sm:text-lg md:text-xl lg:text-2xl">
                        ขอบคุณครับ คุณ <span className="text-white font-semibold">{name}</span>
                    </p>
                    <p className="text-gray-500 text-sm sm:text-base md:text-lg">
                        คุณได้เป็นพันธมิตรของ AIYA แล้ว
                    </p>
                </div>

                {/* Email Warning (if email failed to send) */}
                {!emailSent && (
                    <div className="mb-6 md:mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
                        <svg className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-yellow-200 font-semibold text-sm sm:text-base mb-1">
                                ⚠️ อีเมลยืนยันไม่สามารถส่งได้
                            </p>
                            <p className="text-yellow-300/80 text-xs sm:text-sm">
                                การลงทะเบียนของคุณสำเร็จแล้ว แต่ระบบไม่สามารถส่งอีเมลยืนยันได้ กรุณาบันทึกรหัสพันธมิตรด้านล่างไว้
                            </p>
                        </div>
                    </div>
                )}

                {/* Main System Warning (if main system registration failed) */}
                {!mainSystemSuccess && (
                    <div className="mb-6 md:mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                        <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-red-200 font-semibold text-sm sm:text-base mb-1">
                                ⚠️ รหัสพันธมิตรอาจยังไม่พร้อมใช้งาน
                            </p>
                            <p className="text-red-300/80 text-xs sm:text-sm">
                                การลงทะเบียนของคุณบันทึกเรียบร้อยแล้ว แต่ระบบหลักไม่สามารถเปิดใช้งานรหัสได้ในขณะนี้ กรุณาติดต่อทีมงานเพื่อเปิดใช้งานรหัส: <span className="font-mono font-bold">{affiliateCode}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Affiliate Code Display */}
                <div className="bg-gradient-to-r from-aiya-purple/20 to-aiya-navy/20 rounded-2xl p-5 sm:p-6 md:p-8 mb-6 md:mb-8 border border-aiya-purple/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-aiya-purple to-aiya-navy"></div>

                    <div className="text-center">
                        <p className="text-xs sm:text-sm md:text-base text-gray-400 uppercase tracking-widest font-bold mb-3 md:mb-4">รหัสพันธมิตรของคุณ</p>
                        <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono tracking-wider break-all">{affiliateCode}</p>
                            <button
                                onClick={handleCopyCode}
                                className="shrink-0 p-2 sm:p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 active:scale-95 group relative"
                                title="Copy code"
                            >
                                {copied ? (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                                {copied && (
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-fade-in">
                                        คัดลอกแล้ว!
                                    </span>
                                )}
                            </button>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg text-gray-400">แชร์รหัสนี้เพื่อรับค่าคอมมิชชั่น</p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="bg-white/5 rounded-xl p-4 sm:p-5 md:p-6 border border-white/10 flex gap-3 items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-aiya-purple/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl md:text-3xl">📧</span>
                        </div>
                        <div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-white mb-0.5">ตรวจสอบอีเมลของคุณ</p>
                            <p className="text-xs sm:text-sm md:text-base text-gray-400">เราได้ส่งรหัสพันธมิตรและรายละเอียดไปที่อีเมลแล้ว</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 sm:p-5 md:p-6 border border-white/10 flex gap-3 items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl md:text-3xl">💰</span>
                        </div>
                        <div>
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-white mb-0.5">ค่าคอมมิชชั่นของคุณ</p>
                            <p className="text-xs sm:text-sm md:text-base text-gray-400">รหัสของคุณใช้ได้ทั้ง 2 แพ็กเกจ</p>
                        </div>
                    </div>
                </div>

                {/* Package Info Card - Both Packages */}
                <div className="bg-black/20 rounded-2xl p-5 sm:p-6 md:p-8 mb-6 md:mb-8 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-aiya-purple to-aiya-navy"></div>

                    <div className="mb-4 md:mb-6">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                <span className="text-xl md:text-2xl">🎁</span>
                            </div>
                            <p className="text-sm sm:text-base md:text-lg text-gray-400 uppercase tracking-wide font-bold">รหัสของคุณใช้ได้ทั้ง 2 แพ็กเกจ</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {/* Single Package */}
                        <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-6 h-6 text-aiya-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <h3 className="font-bold text-white text-sm sm:text-base md:text-lg">Single Package</h3>
                            </div>
                            <p className="text-white/60 text-xs sm:text-sm md:text-base mb-3">1 ที่นั่ง</p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs sm:text-sm md:text-base">
                                    <span className="text-white/70">คอมมิชชั่น</span>
                                    <span className="font-bold text-green-400">3,000 บาท</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm md:text-base">
                                    <span className="text-white/70">ส่วนลดลูกค้า</span>
                                    <span className="font-semibold text-orange-400">-1,000 บาท</span>
                                </div>
                            </div>
                        </div>

                        {/* Duo Package */}
                        <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-6 h-6 text-aiya-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <h3 className="font-bold text-white text-sm sm:text-base md:text-lg">Duo Package</h3>
                            </div>
                            <p className="text-white/60 text-xs sm:text-sm md:text-base mb-3">2 ที่นั่ง</p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs sm:text-sm md:text-base">
                                    <span className="text-white/70">คอมมิชชั่น</span>
                                    <span className="font-bold text-green-400">7,000 บาท</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm md:text-base">
                                    <span className="text-white/70">ส่วนลดลูกค้า</span>
                                    <span className="font-semibold text-orange-400">-2,000 บาท</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-white/5 rounded-xl p-5 sm:p-6 md:p-8 border border-white/10 mb-6 md:mb-8">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2.5">
                        <span className="text-xl md:text-2xl">🚀</span>
                        <span>ขั้นตอนต่อไป</span>
                    </h3>
                    <ul className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-gray-300">
                        <li className="flex items-start gap-3">
                            <span className="text-aiya-purple font-bold mt-0.5 text-base md:text-lg">1.</span>
                            <span>แชร์รหัสพันธมิตรให้กับลูกค้าของคุณ</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-aiya-purple font-bold mt-0.5 text-base md:text-lg">2.</span>
                            <span>ลูกค้าใช้รหัสเพื่อรับส่วนลด 1,000 บาท (Single) หรือ 2,000 บาท (Duo)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-aiya-purple font-bold mt-0.5 text-base md:text-lg">3.</span>
                            <span>คุณจะได้รับค่าคอมมิชชั่นทันทีเมื่อยอดขายสำเร็จ</span>
                        </li>
                    </ul>
                </div>

                {/* Payment Info Note */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 sm:p-5 md:p-6 mb-6 md:mb-8">
                    <div className="flex items-start gap-3 md:gap-4">
                        {/* Info Icon */}
                        <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1">
                            <p className="text-sm sm:text-base md:text-lg text-blue-200 leading-relaxed">
                                เมื่อท่านเริ่มแนะนำลูกค้าได้แล้ว ทีมงานจะติดต่อกลับไปทางอีเมลเพื่อขอข้อมูลบัญชีธนาคารสำหรับโอนค่าคอมมิชชั่นในรอบการจ่ายเงินถัดไป
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleClose}
                        className="w-full py-4 sm:py-4.5 md:py-5 lg:py-6 rounded-xl bg-gradient-to-r from-[#3A23B5] to-[#5C499D] text-white font-bold text-lg sm:text-xl md:text-2xl
                        shadow-lg shadow-aiya-purple/20 hover:shadow-aiya-purple/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    >
                        เสร็จสิ้น
                    </button>
                </div>

                <p className="text-center text-gray-600 text-xs sm:text-sm md:text-base mt-6 md:mt-8">
                    *หากไม่ได้รับอีเมล กรุณาตรวจสอบโฟลเดอร์ Spam/Junk
                </p>

            </div>
        </div>
    );
}
