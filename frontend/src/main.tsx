import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { LiffProvider } from './contexts/LiffContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ToastProvider } from './hooks/useToast'

// Validate required environment variables on app startup
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL || API_URL.trim() === '') {
    console.error('❌ VITE_API_URL environment variable is not set!');
    console.error('Please configure VITE_API_URL in your .env file');
    throw new Error('Missing required environment variable: VITE_API_URL');
}

if (import.meta.env.DEV) {
    console.log('✅ API URL configured:', API_URL);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <LanguageProvider>
                <ToastProvider>
                    <LiffProvider>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </LiffProvider>
                </ToastProvider>
            </LanguageProvider>
        </HelmetProvider>
    </React.StrictMode>,
)
