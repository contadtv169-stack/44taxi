import React from 'react';
import { FiBell, FiMenu } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ title }) {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="logo">
        <span>44</span>Taxi
      </div>
      {title && <h1>{title}</h1>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '8px' }}>
          <FiBell size={18} />
        </button>
      </div>
    </header>
  );
}
