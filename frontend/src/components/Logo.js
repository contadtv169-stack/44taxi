import React from 'react';

export default function Logo({ size = 80, color = '#fff', variant = 'full' }) {
  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" stroke={color} strokeWidth="4" />
        <text x="50" y="62" textAnchor="middle" fill={color} fontSize="40" fontWeight="900" fontFamily="sans-serif">44</text>
        <path d="M20 78 Q50 82 80 78" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="35" y="38" width="30" height="20" rx="6" stroke={color} strokeWidth="2" fill="none" />
        <circle cx="50" cy="48" r="4" fill={color} />
      </svg>
    );
  }

  return (
    <svg width={size * 3.5} height={size} viewBox="0 0 350 100" fill="none" style={{ maxWidth: '100%' }}>
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.15" />
      <text x="50" y="65" textAnchor="middle" fill="currentColor" fontSize="44" fontWeight="900" fontFamily="system-ui, sans-serif">44</text>
      <text x="105" y="65" fill="currentColor" fontSize="40" fontWeight="300" fontFamily="system-ui, sans-serif">Taxi</text>
      <text x="105" y="85" fill="currentColor" fontSize="14" fontWeight="400" fontFamily="system-ui, sans-serif" opacity="0.6" letterSpacing="2">MOBILIDADE • DELIVERY</text>
    </svg>
  );
}
