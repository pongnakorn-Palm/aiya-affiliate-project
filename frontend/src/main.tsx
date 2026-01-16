import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { LiffProvider } from './contexts/LiffContext'

// Validate required environment variables on app startup
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL || API_URL.trim() === '') {
    console.error('❌ VITE_API_URL environment variable is not set!');
    console.error('Please configure VITE_API_URL in your .env file');
    throw new Error('Missing required environment variable: VITE_API_URL');
}

console.log('✅ API URL configured:', API_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LiffProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </LiffProvider>
    </React.StrictMode>,
)
