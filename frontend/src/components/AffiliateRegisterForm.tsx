import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface FormData {
    name: string;
    email: string;
    phone: string;
    affiliateCode: string;
    selectedProduct: string;
    note: string;
    pdpaConsent: boolean;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
    affiliateCode?: string;
    selectedProduct?: string;
    pdpaConsent?: string;
}

const PACKAGE_OPTIONS = {
    single_package: {
        label: 'Single Package',
        subtitle: '1 ที่นั่ง',
        commission: '3,000',
        customerDiscount: '1,000',
        icon: '👤'
    },
    duo_package: {
        label: 'Duo Package',
        subtitle: '2 ที่นั่ง',
        commission: '7,000',
        customerDiscount: '1,000',
        icon: '👥'
    }
};

type PackageType = keyof typeof PACKAGE_OPTIONS;

export default function AffiliateRegisterForm() {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        affiliateCode: '',
        selectedProduct: '',
        note: '',
        pdpaConsent: false
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

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
                }
                break;
            case 'affiliateCode':
                if (!value || value.trim().length === 0) {
                    error = 'กรุณากรอก Affiliate Code';
                } else if (!/^[A-Z0-9]+$/.test(value)) {
                    error = 'ใช้ได้เฉพาะตัวอักษร A-Z และตัวเลข 0-9';
                }
                break;
            case 'selectedProduct':
                if (!value) {
                    error = 'กรุณาเลือก Package';
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
        const newErrors: FormErrors = {};
        let isValid = true;

        // Validate all required fields
        ['name', 'email', 'phone', 'affiliateCode', 'selectedProduct', 'pdpaConsent'].forEach(field => {
            if (!validateField(field, formData[field as keyof FormData])) {
                isValid = false;
            }
        });

        // Mark all fields as touched
        setTouched(new Set(['name', 'email', 'phone', 'affiliateCode', 'selectedProduct', 'pdpaConsent']));

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

    const handlePackageSelect = (packageType: string) => {
        setFormData(prev => ({ ...prev, selectedProduct: packageType }));
        if (errors.selectedProduct) {
            setErrors(prev => ({ ...prev, selectedProduct: undefined }));
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
            const response = await fetch(`${apiUrl}/api/register-affiliate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle 409 Conflict (duplicate data)
                if (response.status === 409 && data.field) {
                    // Set field-specific error
                    setErrors(prev => ({
                        ...prev,
                        [data.field]: data.message
                    }));
                    setTouched(prev => new Set(prev).add(data.field));
                    throw new Error(data.message);
                }

                throw new Error(data.message || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง');
            }

            navigate('/thank-you', {
                state: {
                    name: formData.name,
                    affiliateCode: formData.affiliateCode,
                    selectedProduct: formData.selectedProduct,
                    commission: PACKAGE_OPTIONS[formData.selectedProduct as PackageType].commission
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

    return (
        <div className="min-h-screen py-6 px-4 sm:px-6">
            <div className="max-w-lg mx-auto relative z-10 w-full animate-fade-in">

                {/* Hero Banner */}
                <div className="mb-6 overflow-hidden rounded-2xl shadow-2xl">
                    <div className="relative">
                        {/* Banner Image */}
                        <img
                            src="/webinar.png"
                            alt="Master the AI Empire"
                            className="w-full h-auto object-cover"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                        {/* Slogan Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                            <div className="text-center">
                                <p className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-2 drop-shadow-lg leading-tight">
                                    เปลี่ยนคุณเป็น AI Entrepreneur ใน 48 ชม.
                                </p>
                                <p className="text-white/90 text-xs sm:text-sm drop-shadow-md">
                                    แนะนำคอร์สเรียน AI และสร้างรายได้ไปพร้อมกัน
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-aiya-navy mb-2">
                        สมัครเป็นพันธมิตร AIYA
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base mb-4">
                        เริ่มสร้างรายได้จากการแนะนำคอร์สเรียน AI
                    </p>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-aiya-purple to-aiya-navy shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>

                {/* Benefits Banner */}
                <div className="glass-card p-4 mb-6 border-l-4 border-l-aiya-purple">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-aiya-purple/10 flex items-center justify-center shrink-0">
                            <span className="text-xl">💰</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-aiya-navy mb-1 text-sm sm:text-base">ประโยชน์ที่คุณจะได้รับ</h3>
                            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                                <li>• รับ Commission สูงถึง 7,000 บาท/คน</li>
                                <li>• ลูกค้าได้ส่วนลด 1,000 บาททันที</li>
                                <li>• ติดตามยอดขายแบบ Real-time</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form ref={formRef} onSubmit={handleSubmit} className="glass-card p-5 sm:p-6 space-y-5" noValidate>
                    <h2 className="text-lg font-bold text-aiya-navy mb-3">กรอกข้อมูลการสมัคร</h2>

                    {/* Global Error */}
                    {submitError && (
                        <div className="error-message bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-start gap-2 text-sm animate-fade-in">
                            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* ชื่อ-นามสกุล */}
                    <div>
                        <label className="label-modern">
                            ชื่อ-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={() => handleBlur('name')}
                            className={`input-modern ${showError('name') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                            placeholder="สมชาย ใจดี"
                        />
                        {showError('name') && (
                            <p className="error-message text-red-600 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
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
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                            className={`input-modern ${showError('email') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                            placeholder="example@email.com"
                        />
                        {showError('email') && (
                            <p className="error-message text-red-600 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* เบอร์โทรศัพท์ */}
                    <div>
                        <label className="label-modern">
                            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={() => handleBlur('phone')}
                            className={`input-modern ${showError('phone') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                            placeholder="0812345678"
                            inputMode="numeric"
                        />
                        {showError('phone') && (
                            <p className="error-message text-red-600 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
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
                            type="text"
                            name="affiliateCode"
                            value={formData.affiliateCode}
                            onChange={handleAffiliateCodeChange}
                            onBlur={() => handleBlur('affiliateCode')}
                            className={`input-modern font-mono tracking-wider text-base ${showError('affiliateCode') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                            placeholder="PARTNER2025"
                        />
                        <p className="text-xs text-gray-500 mt-1.5 ml-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            ใช้ได้เฉพาะตัวอักษร A-Z และตัวเลข 0-9
                        </p>
                        {showError('affiliateCode') && (
                            <p className="error-message text-red-600 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.affiliateCode}
                            </p>
                        )}
                    </div>

                    {/* Package Selection - Card Based */}
                    <div>
                        <label className="label-modern mb-3">
                            เลือก Package <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(PACKAGE_OPTIONS).map(([key, pkg]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handlePackageSelect(key)}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                        formData.selectedProduct === key
                                            ? 'border-aiya-purple bg-aiya-purple/5 shadow-lg scale-105'
                                            : 'border-gray-200 hover:border-aiya-purple/50 hover:bg-gray-50'
                                    }`}
                                >
                                    {/* Radio indicator */}
                                    <div className="absolute top-3 right-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            formData.selectedProduct === key
                                                ? 'border-aiya-purple bg-aiya-purple'
                                                : 'border-gray-300'
                                        }`}>
                                            {formData.selectedProduct === key && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Icon */}
                                    <div className="text-3xl mb-2">{pkg.icon}</div>

                                    {/* Package name */}
                                    <h3 className="font-bold text-aiya-navy text-base mb-1">{pkg.label}</h3>
                                    <p className="text-xs text-gray-500 mb-3">{pkg.subtitle}</p>

                                    {/* Commission info */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-600">Commission</span>
                                            <span className="font-bold text-green-600">{pkg.commission} บาท</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-600">ส่วนลดลูกค้า</span>
                                            <span className="font-semibold text-orange-600">-{pkg.customerDiscount} บาท</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {showError('selectedProduct') && (
                            <p className="error-message text-red-600 text-xs mt-2 ml-1 flex items-center gap-1 animate-fade-in">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.selectedProduct}
                            </p>
                        )}
                    </div>

                    {/* หมายเหตุ (ไม่บังคับ) */}
                    <div>
                        <label className="label-modern">หมายเหตุ (ไม่บังคับ)</label>
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            className="input-modern min-h-[80px] resize-y"
                            placeholder="บันทึกเพิ่มเติม..."
                        />
                    </div>

                    {/* PDPA Consent Checkbox */}
                    <div>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="pdpaConsent"
                                checked={formData.pdpaConsent}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, pdpaConsent: e.target.checked }));
                                    if (errors.pdpaConsent) {
                                        setErrors(prev => ({ ...prev, pdpaConsent: undefined }));
                                    }
                                }}
                                onBlur={() => handleBlur('pdpaConsent')}
                                className="w-5 h-5 rounded border-gray-300 text-aiya-purple focus:ring-2 focus:ring-aiya-purple/50 cursor-pointer shrink-0 mt-0.5"
                            />
                            <span className="text-sm text-gray-700 leading-relaxed">
                                ข้าพเจ้ายอมรับ{' '}
                                <a
                                    href="https://web.aiya.ai/privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-aiya-purple hover:text-aiya-navy underline font-medium"
                                >
                                    เงื่อนไขการใช้งาน
                                </a>
                                {' '}และ{' '}
                                <a
                                    href="https://web.aiya.ai/privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-aiya-purple hover:text-aiya-navy underline font-medium"
                                >
                                    นโยบายความเป็นส่วนตัว
                                </a>
                                {' '}ของ AIYA <span className="text-red-500">*</span>
                            </span>
                        </label>
                        {showError('pdpaConsent') && (
                            <p className="error-message text-red-600 text-xs mt-1.5 ml-1 flex items-center gap-1 animate-fade-in">
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
                        className="btn-gradient disabled:opacity-60 disabled:cursor-not-allowed mt-2 min-h-[48px]"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                กำลังดำเนินการ...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ลงทะเบียนเป็นพันธมิตร
                            </>
                        )}
                    </button>

                    {/* Privacy Note */}
                    <p className="text-xs text-gray-500 text-center mt-3">
                        🔒 ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย
                    </p>
                </form>

                {/* Footer */}
                <p className="text-center text-gray-400 text-xs mt-6">
                    © 2024 AIYA Co., Ltd. สงวนลิขสิทธิ์
                </p>
            </div>
        </div>
    );
}
