import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiMap, FiCoffee, FiDollarSign, FiUser } from 'react-icons/fi';

const items = [
  { path: '/home', label: 'Inicio', icon: FiHome },
  { path: '/rides', label: 'Corridas', icon: FiMap },
  { path: '/food', label: 'Food', icon: FiCoffee },
  { path: '/earnings', label: 'Ganhos', icon: FiDollarSign },
  { path: '/profile', label: 'Perfil', icon: FiUser },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bottom-nav">
      {items.map(({ path, label, icon: Icon }) => (
        <button
          key={path}
          className={`nav-item ${isActive(path) ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
