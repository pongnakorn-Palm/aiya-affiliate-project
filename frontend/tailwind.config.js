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
                // AIYA CI/CD - Luxury Minimalist Dark Theme
                'aiya': {
                    // Background Colors
                    'dark': '#0D1117',           // Main background (charcoal)
                    'card': '#161B22',           // Card background
                    'card-hover': '#1C2128',     // Card hover state
                    'border': '#30363D',         // Subtle borders

                    // Primary Purple/Lavender
                    'purple': '#7C3AED',         // Deep purple
                    'lavender': '#A78BFA',       // Light purple/lavender
                    'lavender-light': '#C4B5FD', // Lighter lavender

                    // Accent Colors
                    'cyan': '#22D3EE',           // Cyan accent
                    'teal': '#14B8A6',           // Teal
                },

                // Semantic Colors
                'primary': {
                    DEFAULT: '#A78BFA',          // Lavender
                    'dark': '#7C3AED',           // Deep purple
                    'light': '#C4B5FD',          // Light lavender
                },
                'accent': {
                    DEFAULT: '#22D3EE',          // Cyan
                    'teal': '#14B8A6',           // Teal
                },
                'background': {
                    DEFAULT: '#0D1117',          // Main dark bg
                    'card': '#161B22',           // Card bg
                    'elevated': '#1C2128',       // Elevated surfaces
                },

                // Legacy support
                'line-green': '#06C755',

                // Status Colors
                'success': '#22C55E',
                'warning': '#F59E0B',
                'error': '#EF4444',
                'info': '#22D3EE',
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
            backgroundImage: {
                // AIYA Gradients
                'gradient-purple': 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                'gradient-purple-reverse': 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
                'gradient-purple-cyan': 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
                'gradient-card': 'linear-gradient(180deg, #1C2128 0%, #161B22 100%)',
            },
            boxShadow: {
                // Purple glow effects
                'glow': '0 0 20px rgba(167, 139, 250, 0.3)',
                'glow-lg': '0 0 40px rgba(167, 139, 250, 0.4)',
                'glow-xl': '0 0 60px rgba(167, 139, 250, 0.5)',
                // Cyan glow
                'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.3)',
                // Card shadows
                'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
                'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
            },
            animation: {
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)' },
                    '50%': { boxShadow: '0 0 35px rgba(167, 139, 250, 0.5)' },
                },
            },
        },
    },
    plugins: [],
}
