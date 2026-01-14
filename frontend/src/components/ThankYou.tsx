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

    // Get data from previous state
    const name = location.state?.name || '';
    const affiliateCode = location.state?.affiliateCode || '';
    const selectedProduct = location.state?.selectedProduct || '';
    const commission = location.state?.commission || '';

    const packageLabel = selectedProduct === 'single_package'
        ? 'แพ็กเกจเดี่ยว (1 ที่นั่ง)'
        : 'แพ็กเกจคู่ (2 ที่นั่ง)';

    const customerDiscount = selectedProduct === 'single_package' ? '1,000' : '2,000';

    // Generate referral link
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/?ref=${affiliateCode}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClose = () => {
        if (liff.isInClient()) {
            liff.closeWindow();
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-[#020c17] text-white font-[family-name:var(--font-line-seed)] relative overflow-hidden flex items-center justify-center p-4">

            {/* Background Glow Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-aiya-purple/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in">

                {/* Success Icon */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-full h-full bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2 mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300">
                        ลงทะเบียนสำเร็จ! 🎉
                    </h2>
                    <p className="text-gray-400 text-sm">
                        ขอบคุณครับ คุณ <span className="text-white font-semibold">{name}</span>
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm">
                        คุณได้เป็นพันธมิตรของ AIYA แล้ว
                    </p>
                </div>

                {/* Affiliate Code Display */}
                <div className="bg-gradient-to-r from-aiya-purple/20 to-aiya-navy/20 rounded-2xl p-4 sm:p-5 mb-5 border border-aiya-purple/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-aiya-purple to-aiya-navy"></div>

                    <div className="text-center">
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">รหัสพันธมิตรของคุณ</p>
                        <p className="text-xl sm:text-2xl font-bold text-white font-mono tracking-wider mb-1 break-all">{affiliateCode}</p>
                        <p className="text-xs text-gray-400">แชร์รหัสนี้เพื่อรับค่าคอมมิชชั่น</p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3 mb-6">
                    <div className="bg-yellow-500/10 rounded-xl p-3 sm:p-4 border border-yellow-500/30 flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                            <span className="text-lg">⏳</span>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-white">รอทีมงานตรวจสอบ</p>
                            <p className="text-[10px] sm:text-xs text-gray-400">ทีมงานจะตรวจสอบข้อมูลและติดต่อกลับภายใน 1-2 วันทำการ</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-aiya-purple/20 flex items-center justify-center shrink-0">
                            <span className="text-lg">📧</span>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-white">ตรวจสอบอีเมลของคุณ</p>
                            <p className="text-[10px] sm:text-xs text-gray-400">เราได้ส่งรหัสพันธมิตรและรายละเอียดไปที่อีเมลแล้ว</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <span className="text-lg">💰</span>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-white">ค่าคอมมิชชั่นของคุณ</p>
                            <p className="text-[10px] sm:text-xs text-gray-400">{commission} บาท ต่อยอดขาย ({packageLabel})</p>
                        </div>
                    </div>
                </div>

                {/* Package Info Card */}
                <div className="bg-black/20 rounded-2xl p-4 mb-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-aiya-purple to-aiya-navy"></div>

                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                            <span className="text-xl">📦</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">แพ็กเกจที่เลือก</p>
                            <h3 className="font-bold text-white leading-tight mb-1 text-sm">{packageLabel}</h3>
                            <div className="space-y-0.5 text-xs text-gray-400">
                                <p>💵 คอมมิชชั่น: <span className="text-green-400 font-semibold">{commission} บาท</span></p>
                                <p>🎁 ส่วนลดลูกค้า: <span className="text-orange-400 font-semibold">{customerDiscount} บาท</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span>🚀</span>
                        <span>ขั้นตอนต่อไป</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-aiya-purple mt-0.5">1.</span>
                            <span>แชร์รหัสพันธมิตรให้กับลูกค้าของคุณ</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-aiya-purple mt-0.5">2.</span>
                            <span>ลูกค้าใช้รหัสเพื่อรับส่วนลดสูงสุด {customerDiscount} บาท</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-aiya-purple mt-0.5">3.</span>
                            <span>คุณจะได้รับค่าคอมมิชชั่นทันทีเมื่อยอดขายสำเร็จ</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleClose}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#3A23B5] to-[#5C499D] text-white font-bold text-base sm:text-lg
                        shadow-lg shadow-aiya-purple/20 hover:shadow-aiya-purple/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    >
                        เริ่มต้นใช้งาน
                    </button>
                </div>

                <p className="text-center text-gray-600 text-[10px] mt-6">
                    *หากไม่ได้รับอีเมล กรุณาตรวจสอบโฟลเดอร์ Spam/Junk
                </p>

            </div>
        </div>
    );
}
