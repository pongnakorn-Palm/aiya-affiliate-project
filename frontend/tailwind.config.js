/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Legacy colors
                'aiya-navy': '#041527',
                'aiya-purple': '#3A23B5',
                'background-light': '#f8f8f5',
                'background-dark': '#221e10',
                'line-green': '#06C755',
                // Digital Empire Theme
                'empire-bg': '#0F172A',
                'empire-card': '#1E293B',
                'empire-card-light': '#334155',
                'empire-gold': '#FACC15',
                'empire-teal': '#38BDF8',
                'empire-green': '#10B981',
                'empire-red': '#EF4444',
                'empire-orange': '#F97316',
                'empire-purple': '#A855F7',
                'primary': '#FACC15',
            },
            fontFamily: {
                sans: ['"LINE Seed Sans TH"', 'sans-serif'],
                display: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            borderRadius: {
                'DEFAULT': '1rem',
                'lg': '1.5rem',
                'xl': '2rem',
                '2xl': '2.5rem',
                'full': '9999px',
            },
        },
    },
    plugins: [],
}
