import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';

interface FormData {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    company: string;
    businessType: string;
    position: string;
    companySize: string;
}

const BUSINESS_TYPES = [
    'Technology / Software',
    'Marketing / Agency',
    'Retail / E-commerce',
    'Education',
    'Financial Services',
    'Healthcare',
    'Manufacturing',
    'Other'
];

const COMPANY_SIZES = [
    '1-10 คน',
    '11-50 คน',
    '51-200 คน',
    '201-500 คน',
    '500+ คน'
];

export default function RegistrationForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, isLoggedIn, liffObject } = useLiff();

    // [Journey Optimization] Removed redirection logic to allow direct access from external sites.


    const eventTitle = location.state?.eventTitle || 'Master the AI Empire';
    const eventDate = location.state?.eventDate || '14 ม.ค. 2026';

    const [formData, setFormData] = useState<FormData>({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        company: '',
        businessType: '',
        position: '',
        companySize: ''
    });

    // Local state to stabilize "Other" input logic
    const [dropdownSelection, setDropdownSelection] = useState('');
    const [otherText, setOtherText] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-fill from LIFF Context
    useEffect(() => {
        if (profile?.email) {
            setFormData(prev => ({ ...prev, email: profile.email! }));
        }
    }, [profile]);

    // [Removed] Duplicate registration check as per user request to simplify testing


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.firstName || !formData.lastName) return 'กรุณาระบุชื่อ-นามสกุล';
        if (!formData.phone || formData.phone.length < 9) return 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง';
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'กรุณาระบุอีเมลที่ถูกต้อง';
        if (!formData.company) return 'กรุณาระบุชื่อองค์กร';
        if (!formData.businessType) return 'กรุณาเลือกประเภทธุรกิจ';
        if (!formData.position) return 'กรุณาระบุตำแหน่งงาน';
        if (!formData.companySize) return 'กรุณาเลือกขนาดองค์กร';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'การลงทะเบียนล้มเหลว');
            }

            navigate('/thank-you', {
                state: {
                    name: formData.firstName,
                    eventTitle: eventTitle,
                    eventDate: eventDate
                }
            });

        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    const eventImage = location.state?.eventImage || '/webinar.png';
    const eventTime = location.state?.eventTime || '14:30 น.';

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto relative z-10 w-full animate-fade-in">

                {/* Back Button - Points to the main marketing site */}
                <button
                    onClick={() => window.location.href = 'https://web.aiya.ai/th/event/webinar'}
                    className="flex items-center text-gray-400 hover:text-aiya-navy mb-8 text-sm transition-colors"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    ย้อนกลับไปยังหน้าหลัก
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Left Column: Event Context (Desktop Only or Top on Mobile) */}
                    <div className="space-y-6">
                        <div className="glass-card overflow-hidden">
                            <img
                                src={eventImage}
                                alt={eventTitle}
                                className="w-full aspect-video object-cover object-center"
                                style={{ maxHeight: '250px' }}
                            />
                            <div className="p-6 space-y-4">
                                <h1 className="text-2xl font-bold text-aiya-navy leading-tight">
                                    {eventTitle}
                                </h1>
                                <div className="space-y-2">
                                    <p className="flex items-center text-gray-600 text-sm">
                                        <span className="mr-2">📅</span> {eventDate}
                                    </p>
                                    <p className="flex items-center text-gray-600 text-sm">
                                        <span className="mr-2">⏰</span> {eventTime}
                                    </p>
                                    <p className="flex items-center text-gray-600 text-sm">
                                        <span className="mr-2">📍</span> Webinar Online
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-gray-100 mt-4">
                                    <p className="text-xs text-gray-400 leading-relaxed italic">
                                        "โลกถล่มด้วย AI... ธุรกิจที่ใช้แรงงานคนแบบเดิมจะค่อยๆ หายไป"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* User Card (LIFF) - Moved inside left column for desktop */}
                        {isLoggedIn && profile && (
                            <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-l-aiya-purple">
                                {profile.pictureUrl ? (
                                    <img src={profile.pictureUrl} alt="Profile" className="w-12 h-12 rounded-full ring-2 ring-aiya-purple/20" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">👤</div>
                                )}
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Welcome</p>
                                    <p className="text-aiya-navy font-bold text-lg">{profile.displayName}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Registration Form */}
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-5">
                            <h2 className="text-xl font-bold text-aiya-navy mb-4">ข้อมูลผู้ลงทะเบียน</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-modern">ชื่อ</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="สมชาย"
                                    />
                                </div>
                                <div>
                                    <label className="label-modern">นามสกุล</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="input-modern"
                                        placeholder="ใจดี"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label-modern">เบอร์โทรศัพท์</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input-modern"
                                    placeholder="0812345678"
                                />
                            </div>

                            <div>
                                <label className="label-modern">อีเมล</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input-modern"
                                    placeholder="somchai@example.com"
                                />
                            </div>

                            <div>
                                <label className="label-modern">ชื่อองค์กร</label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="input-modern"
                                    placeholder="ชื่อบริษัทของคุณ"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label-modern">ประเภทธุรกิจ</label>
                                    <select
                                        name="dropdownBusinessType"
                                        value={dropdownSelection}
                                        onChange={(e) => {
                                            setDropdownSelection(e.target.value);
                                            if (e.target.value !== 'Other') {
                                                setFormData(prev => ({ ...prev, businessType: e.target.value }));
                                            } else {
                                                setFormData(prev => ({ ...prev, businessType: otherText ? `Other: ${otherText}` : 'Other' }));
                                            }
                                        }}
                                        className="input-modern appearance-none"
                                    >
                                        <option value="">เลือกประเภท...</option>
                                        {BUSINESS_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                {dropdownSelection === 'Other' && (
                                    <div className="animate-fade-in md:col-span-2">
                                        <label className="label-modern text-aiya-purple">ระบุประเภทธุรกิจอื่นๆ</label>
                                        <input
                                            type="text"
                                            name="customBusinessType"
                                            autoFocus
                                            value={otherText}
                                            onChange={(e) => {
                                                setOtherText(e.target.value);
                                                setFormData(prev => ({ ...prev, businessType: `Other: ${e.target.value}` }));
                                            }}
                                            className="input-modern border-aiya-purple/30 bg-aiya-purple/5"
                                            placeholder="กรุณาระบุ..."
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="label-modern">ขนาดองค์กร</label>
                                    <select
                                        name="companySize"
                                        value={formData.companySize}
                                        onChange={handleChange}
                                        className="input-modern appearance-none"
                                    >
                                        <option value="">เลือกขนาด...</option>
                                        {COMPANY_SIZES.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label-modern">ตำแหน่งงาน</label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    className="input-modern"
                                    placeholder="Marketing Manager"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-gradient disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        ยอดรวมกำลังดำเนินการ...
                                    </>
                                ) : (
                                    'ลงทะเบียนเข้าร่วมงาน'
                                )}
                            </button>
                        </form>

                        {!liffObject?.isInClient() && (
                            <div className="p-2 bg-yellow-50 text-yellow-600 text-xs text-center rounded">
                                เปิดใน LINE เพื่อประสบการณ์ที่ดีที่สุด
                            </div>
                        )}

                        <p className="text-center text-gray-400 text-xs mt-8">
                            © 2024 AIYA Co., Ltd.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

