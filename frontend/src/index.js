import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './components/LeafletSafeInit'; // patches DomUtil to suppress _leaflet_pos errors
import './styles/global.css';

// Suppress non-fatal Leaflet _leaflet_pos errors
// Suppress non-fatal Leaflet _leaflet_pos errors
const isLeafletPosError = (msg) => String(msg || '').includes('_leaflet_pos');

// Capture global errors to debug white screen
window.onerror = function(msg, url, line, col, error) {
  if (isLeafletPosError(msg)) return true;
  const errDiv = document.getElementById('js-error');
  if (errDiv) {
    errDiv.style.display = 'block';
    errDiv.innerHTML = `<strong>Erro:</strong> ${msg}<br><small>${url}:${line}:${col}</small>`;
  }
  console.error('Global error:', msg, error);
};

window.addEventListener('unhandledrejection', function(e) {
  const msg = e.reason?.message || e.reason || '';
  if (isLeafletPosError(msg)) return;
  const errDiv = document.getElementById('js-error');
  if (errDiv) {
    errDiv.style.display = 'block';
    errDiv.innerHTML = `<strong>Erro:</strong> ${msg}`;
  }
  console.error('Unhandled rejection:', e.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
