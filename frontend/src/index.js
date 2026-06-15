import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Capture global errors to debug white screen
window.onerror = function(msg, url, line, col, error) {
  const errDiv = document.getElementById('js-error');
  if (errDiv) {
    errDiv.style.display = 'block';
    errDiv.innerHTML = `<strong>Erro:</strong> ${msg}<br><small>${url}:${line}:${col}</small>`;
  }
  console.error('Global error:', msg, error);
};

window.addEventListener('unhandledrejection', function(e) {
  const errDiv = document.getElementById('js-error');
  if (errDiv) {
    errDiv.style.display = 'block';
    errDiv.innerHTML = `<strong>Erro:</strong> ${e.reason?.message || e.reason || 'Erro desconhecido'}`;
  }
  console.error('Unhandled rejection:', e.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
