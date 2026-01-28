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
                // AIYA Corporate Brand Colors (from web.aiya.ai)
                'aiya': {
                    // Primary Brand Colors
                    'navy': '#041527',           // Primary Dark Background
                    'purple': '#3A23B5',         // Primary Brand Purple
                    'purple-dark': '#3D26B8',    // Dark Purple Variant
                    'purple-medium': '#5C499D',  // Medium Purple
                    'lavender': '#8085ED',       // Light Purple/Lavender (Accent)

                    // Accent Colors
                    'gold': '#F3B521',           // Gold/Yellow Accent
                    'cyan': '#87DCED',           // Cyan/Teal Accent
                    'teal': '#01A79E',           // Teal Accent
                    'teal-light': '#1CB7A4',     // Light Teal

                    // Supporting Colors
                    'blue-light': '#C4E0FD',     // Light Blue
                    'blue-lighter': '#CAF0F8',   // Very Light Blue
                    'blue-primary': '#0057FF',   // Primary Blue
                    'blue-dark': '#003294',      // Dark Blue
                    'blue-medium': '#1E4ED8',    // Medium Blue
                },

                // Semantic Colors (using AIYA brand palette)
                'primary': '#3A23B5',            // Brand Purple
                'secondary': '#8085ED',          // Lavender
                'accent': '#F3B521',             // Gold
                'background': {
                    'dark': '#041527',           // Navy
                    'card': '#0a1f3a',          // Slightly lighter than navy
                    'light': '#f8f8f5',
                },

                // Legacy support (backward compatibility)
                'line-green': '#06C755',

                // Status Colors
                'success': '#01A79E',            // Teal
                'warning': '#F3B521',            // Gold
                'error': '#BE0220',              // Red from website
                'info': '#87DCED',               // Cyan
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
                'gradient-aiya': 'linear-gradient(135deg, #041527 0%, #3A23B5 100%)',
                'gradient-aiya-reverse': 'linear-gradient(135deg, #3A23B5 0%, #041527 100%)',
                'gradient-lavender': 'linear-gradient(135deg, #8085ED 0%, #3A23B5 100%)',
                'gradient-gold': 'linear-gradient(135deg, #F3B521 0%, #FFE2B2 100%)',
                'gradient-cyan': 'linear-gradient(135deg, #87DCED 0%, #01A79E 100%)',
            },
            boxShadow: {
                'aiya-sm': '0 2px 8px rgba(58, 35, 181, 0.1)',
                'aiya-md': '0 4px 16px rgba(58, 35, 181, 0.15)',
                'aiya-lg': '0 8px 32px rgba(58, 35, 181, 0.2)',
                'aiya-xl': '0 12px 48px rgba(58, 35, 181, 0.25)',
                'gold': '0 4px 16px rgba(243, 181, 33, 0.3)',
                'lavender': '0 4px 16px rgba(128, 133, 237, 0.3)',
            },
        },
    },
    plugins: [],
}
