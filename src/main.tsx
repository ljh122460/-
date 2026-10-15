import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ignore HMR WebSocket connection errors in dev proxy
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (msg.includes('WebSocket') || msg.includes('ws') || msg.includes('without opened')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
