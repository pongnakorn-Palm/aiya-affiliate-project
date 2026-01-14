import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';

export default function LandingPage() {
    const navigate = useNavigate();
    const { profile, isLoggedIn, login } = useLiff();

    const handleRegister = () => {
        navigate('/register', {
            state: {
                eventTitle: 'Master the AI Empire',
                eventDate: '14 ม.ค. 69',
                // TODO: Replace with image_2e4a48.jpg
                // TODO: Replace with image_2e4a48.jpg
                eventImage: '/webinar.png'
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#020c17] text-white font-[family-name:var(--font-line-seed)] pb-12 relative overflow-hidden">

            {/* Background Glow Effects */}
            <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-aiya-purple/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-aiya-navy/40 rounded-full blur-[100px] pointer-events-none" />

            {/* Navbar / Header */}
            <nav className="relative z-50 px-6 py-5 flex justify-between items-center">
                <div className="text-xl font-bold tracking-tighter">
                    AIYA<span className="text-aiya-purple">.</span>
                </div>

                {/* LIFF Profile */}
                <div className="flex items-center gap-3">
                    {isLoggedIn && profile ? (
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-1.5 py-1.5 pr-3 rounded-full border border-white/10">
                            {profile.pictureUrl ? (
                                <img src={profile.pictureUrl} alt={profile.displayName} className="w-7 h-7 rounded-full ring-2 ring-white/20" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-aiya-purple/50 flex items-center justify-center text-white text-xs font-bold">
                                    {profile.displayName.charAt(0)}
                                </div>
                            )}
                            <span className="text-xs font-medium text-gray-200 max-w-[80px] truncate hidden sm:block">
                                {profile.displayName}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="text-xs font-bold text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all border border-white/5"
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 px-6 pt-4 lg:pt-12 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Text & CTA */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
                        {/* Hero Text */}
                        <div className="space-y-4 mb-10 w-full animate-fade-in">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                                Master the <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9F85FF] to-[#3A23B5]">
                                    AI Empire
                                </span>
                            </h1>

                            <h2 className="text-xl lg:text-2xl font-medium text-gray-200">
                                Build Your Business.
                            </h2>

                            <p className="text-gray-400 text-sm lg:text-base leading-relaxed max-w-sm mx-auto lg:mx-0 pt-2">
                                โลกถล่มด้วย AI... ธุรกิจที่ใช้แรงงานคนแบบเดิมจะค่อยๆ หายไป
                                คุณจะปรับตัวหรือจะถูกทิ้งไว้ข้างหลัง
                            </p>
                        </div>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-3 gap-4 w-full mb-10 border-y border-white/5 py-6">
                            <div className="flex flex-col items-center lg:items-start gap-1">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1 text-aiya-purple">
                                    <span className="text-lg">📅</span>
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">DATE</span>
                                <span className="text-sm font-bold">14 JAN</span>
                            </div>
                            <div className="flex flex-col items-center lg:items-start gap-1 border-x border-white/5 lg:border-none">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1 text-aiya-purple">
                                    <span className="text-lg">⏰</span>
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">TIME</span>
                                <span className="text-sm font-bold">14:30</span>
                            </div>
                            <div className="flex flex-col items-center lg:items-start gap-1">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1 text-aiya-purple">
                                    <span className="text-lg">🎥</span>
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">TYPE</span>
                                <span className="text-sm font-bold">Webinar</span>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="w-full max-w-sm">
                            <button
                                onClick={handleRegister}
                                className="w-full py-4 rounded-full bg-gradient-to-r from-[#3A23B5] to-[#5C499D] text-white font-bold text-lg shadow-lg shadow-aiya-purple/30 relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all duration-300"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    ลงทะเบียนเข้าร่วม
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                            </button>

                            <p className="mt-4 text-[10px] text-gray-600">
                                *Limited seats available for this exclusive session.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Banner Image */}
                    <div className="w-full order-1 lg:order-2">
                        <div className="w-full aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-aiya-purple/10 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020c17]/40 via-transparent to-transparent z-10" />
                            <img
                                src="/webinar.png"
                                alt="Master the AI Empire"
                                className="w-full h-full object-cover object-center transform lg:scale-110 group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            {/* Live Badge */}
                            <div className="absolute top-4 left-4 z-20">
                                <span className="flex items-center gap-2 bg-[#020c17]/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold tracking-wider text-gray-200">LIVE SESSION</span>
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
