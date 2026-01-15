import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';

interface FormData {
    name: string;
    email: string;
    phone: string;
    affiliateCode: string;
    note: string;
    pdpaConsent: boolean;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
    affiliateCode?: string;
    pdpaConsent?: string;
}


export default function AffiliateRegisterForm() {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const { isLoggedIn, profile, login, isReady, isInClient } = useLiff();

    // Refs for input fields
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const affiliateCodeRef = useRef<HTMLInputElement>(null);
    const noteRef = useRef<HTMLTextAreaElement>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        affiliateCode: '',
        note: '',
        pdpaConsent: false
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Auto-fill form data from LINE profile (only if fields are empty)
    useEffect(() => {
        if (isLoggedIn && profile) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || profile.displayName || '',
                email: prev.email || profile.email || ''
            }));
        }
    }, [isLoggedIn, profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        setSubmitError('');
    };

    const handleBlur = (fieldName: string) => {
        setTouched(prev => new Set(prev).add(fieldName));
        validateField(fieldName, formData[fieldName as keyof FormData]);
    };

    const validateField = (fieldName: string, value: any) => {
        let error: string | undefined;

        switch (fieldName) {
            case 'name':
                if (!value || value.trim().length === 0) {
                    error = 'กรุณากรอกชื่อ-นามสกุล';
                }
                break;
            case 'email':
                if (!value || value.trim().length === 0) {
                    error = 'กรุณากรอก Email';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'รูปแบบ Email ไม่ถูกต้อง';
                }
                break;
            case 'phone':
                if (!value || value.trim().length === 0) {
                    error = 'กรุณากรอกเบอร์โทรศัพท์';
                } else if (value.length < 9) {
                    error = 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก';
                } else if (value.length > 10) {
                    error = 'เบอร์โทรศัพท์ต้องไม่เกิน 10 หลัก';
                }
                break;
            case 'affiliateCode':
                if (!value || value.trim().length === 0) {
                    error = 'กรุณากรอก Affiliate Code';
                } else if (!/^[A-Z0-9]+$/.test(value)) {
                    error = 'ใช้ได้เฉพาะตัวอักษร A-Z และตัวเลข 0-9';
                }
                break;
            case 'pdpaConsent':
                if (!value) {
                    error = 'กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว';
                }
                break;
        }

        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return !error;
    };

    const validateForm = (): boolean => {
        let isValid = true;

        // Validate all required fields
        ['name', 'email', 'phone', 'affiliateCode', 'pdpaConsent'].forEach(field => {
            if (!validateField(field, formData[field as keyof FormData])) {
                isValid = false;
            }
        });

        // Mark all fields as touched
        setTouched(new Set(['name', 'email', 'phone', 'affiliateCode', 'pdpaConsent']));

        return isValid;
    };

    const handleAffiliateCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9]/g, '');
        setFormData(prev => ({ ...prev, affiliateCode: value }));

        if (errors.affiliateCode) {
            setErrors(prev => ({ ...prev, affiliateCode: undefined }));
        }
        setSubmitError('');
    };


    const scrollToError = () => {
        setTimeout(() => {
            const firstError = formRef.current?.querySelector('.error-message');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    // Handle Enter key to navigate to next field
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, nextRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextRef?.current) {
                nextRef.current.focus();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            scrollToError();
            return;
        }

        setIsLoading(true);
        setSubmitError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';

            // ========================================
            // STEP 1: บันทึกลง Event Registration DB (เก็บข้อมูลไว้ที่ฉัน)
            // ========================================
            const eventDbResponse = await fetch(`${apiUrl}/api/register-affiliate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const eventDbData = await eventDbResponse.json();

            if (!eventDbResponse.ok) {
                // Handle 409 Conflict (duplicate data)
                if (eventDbResponse.status === 409 && eventDbData.field) {
                    setErrors(prev => ({
                        ...prev,
                        [eventDbData.field]: eventDbData.message
                    }));
                    setTouched(prev => new Set(prev).add(eventDbData.field));
                    throw new Error(eventDbData.message);
                }

                throw new Error(eventDbData.message || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง');
            }

            console.log('✅ Event DB registered:', eventDbData);

            // ========================================
            // STEP 2: ยิงไปที่ Main System DB (ให้ affiliate code ใช้งานได้จริง)
            // ========================================
            try {
                const mainSystemResponse = await fetch(`${apiUrl}/api/register-affiliate-main`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        tel: formData.phone,  // แปลง phone -> tel
                        generatedCode: formData.affiliateCode  // แปลง affiliateCode -> generatedCode
                    })
                });

                const mainSystemData = await mainSystemResponse.json();

                if (!mainSystemResponse.ok) {
                    console.warn('⚠️ Main System DB registration failed:', mainSystemData);
                    // ไม่ throw error เพราะข้อมูลถูกบันทึกที่ event DB แล้ว
                    // แจ้งเตือนแต่ให้ดำเนินการต่อ
                } else {
                    console.log('✅ Main System DB registered:', mainSystemData);
                }
            } catch (mainSystemError) {
                console.error('❌ Main System DB error:', mainSystemError);
                // ไม่ throw error เพราะข้อมูลถูกบันทึกที่ event DB แล้ว
            }

            // ========================================
            // STEP 3: Navigate to Thank You page
            // ========================================
            navigate('/thank-you', {
                state: {
                    name: formData.name,
                    affiliateCode: formData.affiliateCode
                }
            });

        } catch (err: any) {
            setSubmitError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            scrollToError();
        } finally {
            setIsLoading(false);
        }
    };

    const showError = (fieldName: string) => {
        return touched.has(fieldName) && errors[fieldName as keyof FormErrors];
    };

    // Show loading spinner while LIFF is initializing
    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020c17] via-[#0a1628] to-[#020c17]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-aiya-purple mb-4"></div>
                    <p className="text-white/70 text-sm">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
            <div className="w-full max-w-5xl mx-auto relative z-10 animate-fade-in">


                {/* Event Info Card */}
                <div className="mb-6 md:mb-8">
                    {/* Banner Image */}
                    <div className="overflow-hidden rounded-2xl">
                        <img
                            src="/aff-banner.png"
                            alt="มาเป็นพันธิมิตรกับเรา"
                            className="w-full h-auto object-cover aspect-[3/2]"
                        />
                    </div>

                    {/* Text Content Below Banner */}
                    <div className="p-4 sm:p-6 md:p-8">
                        <div className="text-center">
                            <h2 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 leading-tight">
                                มาเป็นพันธิมิตรกับเรา<br />เพื่อก้าวไปข้างหน้าด้วยกัน
                            </h2>
                            <div className="text-white/90 text-sm sm:text-base md:text-lg space-y-2.5 md:space-y-3 text-left inline-block">
                                <div className="flex items-start gap-3 md:gap-4">
                                    <svg className="w-6 h-6 md:w-7 md:h-7 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#8c52ff" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>ได้ค่าคอมมิชชั่น</span>
                                </div>
                                <div className="flex items-start gap-3 md:gap-4">
                                    <svg className="w-6 h-6 md:w-7 md:h-7 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#8c52ff" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span>ได้ส่วนลดให้ผู้สมัครคอร์ส</span>
                                </div>
                                <div className="flex items-start gap-3 md:gap-4">
                                    <svg className="w-6 h-6 md:w-7 md:h-7 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#8c52ff" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span>ผู้สมัครได้ความรู้ AI ช่วยธุรกิจของคุณให้สำเร็จ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LINE Login Button - Only show in LINE client (LIFF) */}
                {isReady && isInClient && !isLoggedIn && (
                    <button
                        onClick={login}
                        className="mb-4 md:mb-6 w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34b] text-white font-medium px-4 py-2.5 md:py-3 rounded-lg transition-colors duration-200 text-sm md:text-base"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                        เข้าสู่ระบบด้วย LINE
                    </button>
                )}

                {/* LINE Profile Display - Only show in LINE client (LIFF) */}
                {isReady && isInClient && isLoggedIn && profile && (
                    <div className="mb-6 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-lg backdrop-blur-md relative overflow-hidden">
                        {/* Decorative Glow */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-aiya-purple/10 blur-[40px] rounded-full pointer-events-none"></div>

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {profile.pictureUrl ? (
                                <img
                                    src={profile.pictureUrl}
                                    alt={profile.displayName}
                                    className="w-14 h-14 rounded-full border-2 border-white/20 shadow-md object-cover"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aiya-purple to-aiya-navy flex items-center justify-center text-white text-xl font-bold border-2 border-white/20">
                                    {profile.displayName?.charAt(0)}
                                </div>
                            )}
                            {/* LINE Status Indicator (Green dot) */}
                            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#06C755] border-2 border-[#020c17] rounded-full"></div>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0 z-10">
                            <p className="text-xs text-gray-400 font-medium mb-0.5">เข้าสู่ระบบโดย</p>
                            <h3 className="text-white text-lg font-bold truncate tracking-tight leading-tight">
                                {profile.displayName}
                            </h3>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form ref={formRef} onSubmit={handleSubmit} className="glass-card p-5 sm:p-6 md:p-8 lg:p-10 space-y-5 md:space-y-6" noValidate>
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 md:mb-4">กรอกข้อมูลการสมัคร</h2>

                    {/* Global Error */}
                    {submitError && (
                        <div className="error-message bg-red-500/20 border border-red-400/50 text-red-300 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3 text-sm md:text-base animate-fade-in">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* Personal Information - 2 Column Layout on Desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* ชื่อ-นามสกุล */}
                        <div>
                            <label className="label-modern">
                                ชื่อ-นามสกุล <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={nameRef}
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={() => handleBlur('name')}
                                onKeyDown={(e) => handleKeyDown(e, emailRef)}
                                enterKeyHint="next"
                                className={`input-modern ${showError('name') ? 'ring-2 ring-red-400/50' : ''}`}
                                placeholder="สมชาย ใจดี"
                            />
                            {showError('name') && (
                                <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="label-modern">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={emailRef}
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={() => handleBlur('email')}
                                onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                                enterKeyHint="next"
                                className={`input-modern ${showError('email') ? 'ring-2 ring-red-400/50' : ''}`}
                                placeholder="example@email.com"
                            />
                            {showError('email') && (
                                <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Contact & Code - 2 Column Layout on Desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* เบอร์โทรศัพท์ */}
                        <div>
                            <label className="label-modern">
                                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={phoneRef}
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={() => handleBlur('phone')}
                                onKeyDown={(e) => handleKeyDown(e, affiliateCodeRef)}
                                enterKeyHint="next"
                                maxLength={10}
                                className={`input-modern ${showError('phone') ? 'ring-2 ring-red-400/50' : ''}`}
                                placeholder="0812345678"
                                inputMode="numeric"
                            />
                            {showError('phone') && (
                                <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* Affiliate Code */}
                        <div>
                            <label className="label-modern">
                                Affiliate Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={affiliateCodeRef}
                                type="text"
                                name="affiliateCode"
                                value={formData.affiliateCode}
                                onChange={handleAffiliateCodeChange}
                                onBlur={() => handleBlur('affiliateCode')}
                                onKeyDown={(e) => handleKeyDown(e, noteRef)}
                                enterKeyHint="next"
                                className={`input-modern font-mono tracking-wider text-base ${showError('affiliateCode') ? 'ring-2 ring-red-400/50' : ''}`}
                                placeholder="PARTNER2025"
                            />
                            <p className="text-xs text-white/60 mt-1.5 ml-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                ใช้ได้เฉพาะตัวอักษร A-Z และตัวเลข 0-9
                            </p>
                            {showError('affiliateCode') && (
                                <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.affiliateCode}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Package Information Card */}
                    <div className="bg-gradient-to-r from-aiya-purple/10 to-aiya-navy/10 rounded-2xl p-5 md:p-6 lg:p-8 border border-aiya-purple/20">
                        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-aiya-purple/20 flex items-center justify-center shrink-0">
                                <span className="text-xl md:text-2xl">🎁</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base md:text-lg lg:text-xl mb-1">รหัสพันธมิตรใช้ได้ทั้ง 2 แพ็กเกจ</h3>
                                <p className="text-white/70 text-sm md:text-base">ลูกค้าของคุณสามารถใช้รหัสนี้เพื่อรับส่วนลดได้ทั้งแพ็กเกจเดี่ยวและแพ็กเกจคู่</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            {/* Single Package */}
                            <div className="bg-white/5 rounded-xl p-3 md:p-4 lg:p-5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <svg className="w-6 h-6 text-aiya-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <h4 className="font-bold text-white text-sm md:text-base lg:text-lg">Single Package</h4>
                                </div>
                                <p className="text-white/60 text-xs md:text-sm mb-2">1 ที่นั่ง</p>
                                <div className="space-y-1 md:space-y-2">
                                    <div className="flex justify-between items-center text-xs md:text-sm lg:text-base">
                                        <span className="text-white/70">Commission</span>
                                        <span className="font-bold text-green-400">3,000 บาท</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs md:text-sm lg:text-base">
                                        <span className="text-white/70">ส่วนลดลูกค้า</span>
                                        <span className="font-semibold text-orange-400">-1,000 บาท</span>
                                    </div>
                                </div>
                            </div>

                            {/* Duo Package */}
                            <div className="bg-white/5 rounded-xl p-3 md:p-4 lg:p-5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <svg className="w-6 h-6 text-aiya-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <h4 className="font-bold text-white text-sm md:text-base lg:text-lg">Duo Package</h4>
                                </div>
                                <p className="text-white/60 text-xs md:text-sm mb-2">2 ที่นั่ง</p>
                                <div className="space-y-1 md:space-y-2">
                                    <div className="flex justify-between items-center text-xs md:text-sm lg:text-base">
                                        <span className="text-white/70">Commission</span>
                                        <span className="font-bold text-green-400">7,000 บาท</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs md:text-sm lg:text-base">
                                        <span className="text-white/70">ส่วนลดลูกค้า</span>
                                        <span className="font-semibold text-orange-400">-1,000 บาท</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* หมายเหตุ (ไม่บังคับ) */}
                    <div>
                        <label className="label-modern text-sm md:text-base">หมายเหตุ (ไม่บังคับ)</label>
                        <textarea
                            ref={noteRef}
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            enterKeyHint="done"
                            className="input-modern min-h-[80px] md:min-h-[100px] resize-y text-sm md:text-base"
                            placeholder="บันทึกเพิ่มเติม..."
                        />
                    </div>

                    {/* PDPA Consent Checkbox */}
                    <div>
                        <div className="flex items-center">
                            <input
                                id="pdpa-checkbox"
                                type="checkbox"
                                checked={formData.pdpaConsent}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, pdpaConsent: e.target.checked }));
                                    if (errors.pdpaConsent) {
                                        setErrors(prev => ({ ...prev, pdpaConsent: undefined }));
                                    }
                                    setSubmitError('');
                                }}
                                onBlur={() => handleBlur('pdpaConsent')}
                                className={`w-4 h-4 border rounded-md bg-white/10 focus:ring-2 focus:ring-aiya-purple/50 text-aiya-purple cursor-pointer ${showError('pdpaConsent') ? 'border-red-400' : 'border-white/40'}`}
                            />
                            <label htmlFor="pdpa-checkbox" className="select-none ms-2 text-sm font-medium text-white/90 cursor-pointer">
                                ข้าพเจ้ายอมรับ{' '}
                                <a href="#" className="text-blue-400 hover:underline">เงื่อนไขการใช้งาน</a>{' '}
                                และ{' '}
                                <a href="#" className="text-blue-400 hover:underline">นโยบายความเป็นส่วนตัว</a>{' '}
                                ของ AIYA <span className="text-red-400">*</span>
                            </label>
                        </div>
                        {showError('pdpaConsent') && (
                            <p className="error-message text-red-300 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.pdpaConsent}
                            </p>
                        )}
                    </div>



                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-gradient disabled:opacity-60 disabled:cursor-not-allowed mt-2 min-h-[48px] md:min-h-[56px] text-base md:text-lg"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 md:h-6 md:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                กำลังดำเนินการ...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                ลงทะเบียนเป็นพันธมิตร
                            </>
                        )}
                    </button>

                    {/* Privacy Note */}
                    <p className="text-xs md:text-sm text-white/60 text-center mt-3 md:mt-4 flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย</span>
                    </p>
                </form>

                {/* Footer */}
                <p className="text-center text-white/40 text-xs md:text-sm mt-6 md:mt-8">
                    © 2024 AIYA Co., Ltd. สงวนลิขสิทธิ์
                </p>
            </div>
        </div>
    );
}
