import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Application starting...');

// Simple error handler for early initialization errors
window.onerror = (message, source, lineno, colno, error) => {
    console.error('CRITICAL INITIALIZATION ERROR:', { message, source, lineno, colno, error });
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `<div style="padding: 20px; color: red;"><h1>Critical Error</h1><p>${message}</p></div>`;
    }
    return false;
};

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        console.error('Main.tsx: Root element not found!');
    } else {
        console.log('Main.tsx: Mounting React...');
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
        )
        console.log('Main.tsx: Render called.');
    }
} catch (error) {
    console.error('Main.tsx: Catch block error:', error);
}
