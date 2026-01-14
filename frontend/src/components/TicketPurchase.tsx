import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';

export default function TicketPurchase() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { profile } = useLiff();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedPackage, setSelectedPackage] = useState<'SINGLE' | 'DUO'>('SINGLE');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        referralCode: ''
    });

    const PACKAGES = {
        SINGLE: { price: 29900, fullPrice: 34900, save: 5000, label: 'SINGLE SEAT (1 ท่าน)' },
        DUO: { price: 54900, fullPrice: 69800, save: 14900, label: 'DUO PACK (2 ท่าน)' }
    };

    // 1. Auto-fill from URL Query Params (Priority: High)
    // Example: /tickets?package=DUO&name=John&email=john@example.com&referral=ABC
    useEffect(() => {
        const pkgParam = searchParams.get('package')?.toUpperCase();
        if (pkgParam === 'SINGLE' || pkgParam === 'DUO') {
            setSelectedPackage(pkgParam as 'SINGLE' | 'DUO');
        }

        const nameParam = searchParams.get('name');
        const emailParam = searchParams.get('email');
        const phoneParam = searchParams.get('phone') || searchParams.get('tel');
        const refParam = searchParams.get('referral') || searchParams.get('code');

        if (nameParam || emailParam || phoneParam || refParam) {
            setFormData(prev => ({
                ...prev,
                name: nameParam || prev.name,
                email: emailParam || prev.email,
                phone: phoneParam || prev.phone,
                referralCode: refParam || prev.referralCode
            }));
        }
    }, [searchParams]);

    // 2. Auto-fill from LIFF (Priority: Low - only if empty)
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                email: (!prev.email) ? (profile.email || '') : prev.email,
                name: (!prev.name) ? (profile.displayName || '') : prev.name
            }));
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [discount, setDiscount] = useState(0);
    const isCheckingVoucher = false; // Placeholder

    // --- INTEGRATION POINT: Voucher API ---
    // ฟังก์ชันสำหรับเช็ค Code กับหลังบ้านพี่ชาย
    const validateVoucher = async (code: string, pack: 'SINGLE' | 'DUO') => {
        if (!code || code.length < 3) {
            setDiscount(0);
            return;
        }

        // TODO: Start Loading State if needed
        try {
            // TODO: พี่ชายมาแก้ตรงนี้ได้เลยครับเพื่อยิงไป API จริง
            // const res = await fetch(`https://api.aiya.com/check-voucher?code=${code}`);
            // const data = await res.json();
            // setDiscount(data.discountAmount);

            // Mock Logic (ปัจจุบัน): ลด 1,000 ต่อที่นั่ง
            await new Promise(r => setTimeout(r, 500)); // Simulate API delay
            const discountPerSeat = 1000;
            const totalDiscount = pack === 'DUO' ? discountPerSeat * 2 : discountPerSeat;
            setDiscount(totalDiscount);

        } catch (error) {
            console.error("Voucher Error", error);
            setDiscount(0);
        } finally {
            // TODO: End Loading State if needed
        }
    };

    // Re-validate when package or code changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.referralCode) {
                validateVoucher(formData.referralCode, selectedPackage);
            } else {
                setDiscount(0);
            }
        }, 800); // Debounce typing
        return () => clearTimeout(timer);
    }, [formData.referralCode, selectedPackage]);


    const handlePurchase = async () => {
        if (!formData.name || !formData.email || !formData.phone) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        // Split name for backend
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0] || '-';
        const lastName = nameParts.slice(1).join(' ') || '-';

        setIsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email: formData.email,
                    phone: formData.phone,
                    amount: PACKAGES[selectedPackage].price - discount, // Use calculated discount
                    packageType: selectedPackage,
                    referralCode: formData.referralCode
                })
            });

            if (response.ok) {
                alert('ส่งคำสั่งซื้อสำเร็จ! กรุณาชำระเงินในขั้นตอนถัดไป');
                navigate('/');
            } else {
                alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
            }
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020c17] text-white font-[family-name:var(--font-line-seed)] p-4 md:p-8 flex items-center justify-center">

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

                {/* Left Column: Intro & Packages */}
                <div className="space-y-8">
                    {/* Back Button */}
                    <div className="mb-4 md:mb-0">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5 -ml-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            <span className="text-sm font-medium">ย้อนกลับ</span>
                        </button>
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            พร้อมสร้างอาณาจักร<br className="hidden md:block" /> ของคุณหรือยัง?
                        </h1>
                        <p className="text-gray-400 text-lg font-light leading-relaxed">
                            เลือกแพ็กเกจที่ต้องการเพื่อจองสิทธิ์ในราคาพิเศษ <br className="hidden md:block" />
                            ระบบจะพาคุณไปยังหน้าชำระเงินถัดไป
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Single Package */}
                        <div
                            onClick={() => setSelectedPackage('SINGLE')}
                            className={`relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-300 group ${selectedPackage === 'SINGLE' ? 'bg-[#1e1b4b]/60 border-[#5C499D] shadow-2xl shadow-[#5C499D]/20' : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className={`font-bold text-sm uppercase tracking-wider ${selectedPackage === 'SINGLE' ? 'text-[#5C499D]' : 'text-gray-400'}`}>SINGLE SEAT (1 ท่าน)</span>
                                <span className="bg-[#3A23B5] text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg shadow-[#3A23B5]/40 animate-pulse">ประหยัด 5,000</span>
                            </div>
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-5xl font-bold text-white tracking-tight">29,900</span>
                                <span className="text-gray-500 line-through text-lg">34,900</span>
                            </div>
                            <p className="text-xs text-gray-500 font-light">ราคาไม่รวมภาษีมูลค่าเพิ่ม</p>
                        </div>

                        {/* Duo Package */}
                        <div
                            onClick={() => setSelectedPackage('DUO')}
                            className={`relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-300 group ${selectedPackage === 'DUO' ? 'bg-[#1e1b4b]/60 border-[#5C499D] shadow-2xl shadow-[#5C499D]/20' : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className={`font-bold text-sm uppercase tracking-wider ${selectedPackage === 'DUO' ? 'text-[#5C499D]' : 'text-gray-400'}`}>DUO PACK (2 ท่าน)</span>
                                <span className="bg-[#3A23B5] text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg shadow-[#3A23B5]/40 animate-pulse">ประหยัด 14,900</span>
                            </div>
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-5xl font-bold text-white tracking-tight">54,900</span>
                                <span className="text-gray-500 line-through text-lg">69,800</span>
                            </div>
                            <p className="text-xs text-gray-500 font-light">ราคาไม่รวมภาษีมูลค่าเพิ่ม</p>
                        </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        {[
                            'ชำระเงินปลอดภัย (Credit Card / PromptPay)',
                            'ยืนยันที่นั่งทันทีผ่านอีเมล',
                            'ออกใบกำกับภาษีเต็มรูปแบบได้',
                            'โบนัสพิเศษ: Cloud Credit มูลค่า $300',
                            'สิทธิ์ Consultant 1:1 รายบุคคล (เฉพาะ 10 ท่านแรก)'
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-gray-300 group hover:text-white transition-colors">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/10 border border-green-500/50 flex items-center justify-center text-green-400 text-xs shrink-0 group-hover:scale-110 transition-transform">✓</div>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: User Form */}
                <div className="bg-transparent lg:pl-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-2">ข้อมูลผู้สมัคร</h2>
                        <p className="text-gray-400 text-sm">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อรับสิทธิพิเศษ</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">ชื่อ-นามสกุล</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nattapat Lamnui"
                                    className="w-full bg-[#0b1623] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#5C499D] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">อีเมล</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="nattapat@aiya.ai"
                                        className="w-full bg-[#0b1623] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#5C499D] transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">เบอร์โทรศัพท์</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="0910424154"
                                        className="w-full bg-[#0b1623] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#5C499D] transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">รหัสส่วนลด / รหัสผู้นะนำ (ถ้ามี)</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" x2="20" y1="8" y2="14" /><line x1="23" x2="17" y1="11" y2="11" /></svg>
                                </div>
                                <input
                                    type="text"
                                    name="referralCode"
                                    value={formData.referralCode}
                                    onChange={handleChange}
                                    placeholder="ระบุเพื่อรับโบนัสพิเศษ"
                                    className="w-full bg-[#0b1623] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#5C499D] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-4">
                            <div className="mt-1 text-[#5C499D]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                            </div>
                            <p className="text-sm text-gray-400">
                                รับส่วนลดทันที 1,000 บาท/ที่นั่ง เมื่อใส่รหัสผู้นะนำ
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full py-4 mt-8 rounded-full bg-gradient-to-r from-[#3A23B5] to-[#5C499D] text-white font-bold text-lg hover:shadow-lg hover:shadow-aiya-purple/30 transition-all flex flex-col items-center justify-center gap-1 group"
                        >
                            <div className="flex items-center gap-2">
                                <span>{isCheckingVoucher ? 'กำลังตรวจสอบโค้ด...' : 'ชำระเงิน'}</span>
                                {!isCheckingVoucher && <svg className="group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>}
                            </div>
                            <span className="text-xs font-normal opacity-90">
                                ยอดรวม: ฿{(PACKAGES[selectedPackage].price - discount).toLocaleString()}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal (Reused) */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-[family-name:var(--font-line-seed)]">
                    <div className="bg-[#0b1623] border border-white/10 rounded-[32px] p-8 max-w-sm w-full relative shadow-2xl overflow-hidden">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3A23B5]/20 rounded-full blur-[50px] pointer-events-none"></div>

                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-8 relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-2">สแกน QR เพื่อชำระเงิน</h3>

                            {/* Price Breakdown */}
                            <div className="flex flex-col gap-1 items-center justify-center text-[#8B9CC8]">
                                <div className="flex items-center gap-2 text-sm">
                                    <span>ราคาปกติ</span>
                                    <span className={discount > 0 ? "line-through text-gray-500" : ""}>
                                        ฿{PACKAGES[selectedPackage].price.toLocaleString()}
                                    </span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-green-400">
                                        <span>ส่วนลด Referral</span>
                                        <span>-฿{discount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm">ยอดชำระสุทธิ</span>
                                    <span className="text-2xl font-bold text-white">
                                        ฿{(PACKAGES[selectedPackage].price - discount).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-3xl mb-6 mx-auto w-64 h-auto flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10">
                            {/* QR Section */}
                            <div className="w-64 h-64 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 mb-4 relative overflow-hidden group">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><rect x="7" y="7" width="3" height="3" /><rect x="14" y="7" width="3" height="3" /><rect x="7" y="14" width="3" height="3" /><line x1="14" y1="14" x2="14" y2="14" /></svg>
                                <span className="text-gray-400 text-xs mt-2">[QR Code PromptPay]</span>
                            </div>

                            {/* Slip Upload Section */}
                            <div className="w-full">
                                <label className="block w-full cursor-pointer group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Simulating Upload & Verify
                                                // In real world: Upload to Server -> Send URL to Slip Verification API
                                                alert(`เลือกไฟล์: ${file.name}\n(จำลอง: กำลังส่งตรวจสลิป...)`);
                                            }
                                        }}
                                    />
                                    <div className="w-full py-3 rounded-xl border-2 border-[#3A23B5] border-dashed flex items-center justify-center gap-2 text-[#3A23B5] font-bold text-sm bg-[#3A23B5]/5 hover:bg-[#3A23B5]/10 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        <span>แนบสลิปโอนเงิน</span>
                                    </div>
                                </label>
                                <p className="text-[10px] text-gray-400 text-center mt-2">
                                    *ระบบสามารถเชื่อม API ตรวจสลิปได้ตรงจุดนี้
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handlePurchase}
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2CB67D] to-[#25a06d] text-white font-bold text-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] relative z-10"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    กำลังดำเนินการ...
                                </span>
                            ) : 'ยืนยันการโอนเงิน'}
                        </button>

                        <p className="mt-4 text-[10px] text-center text-gray-500 relative z-10">
                            บริษัท เอไอยะ จำกัด (สำนักงานใหญ่)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
