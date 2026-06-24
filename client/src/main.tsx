import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';

// DEBUG: Log import.meta.env at runtime
console.log('import.meta.env =', import.meta.env);
console.log('VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
