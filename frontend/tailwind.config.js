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
                'aiya-navy': '#041527',
                'aiya-purple': '#3A23B5',
                'primary': '#f2b90d',
                'background-light': '#f8f8f5',
                'background-dark': '#221e10',
                'line-green': '#06C755',
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
