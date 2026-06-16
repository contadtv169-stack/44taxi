import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import NotificationPrompt from './NotificationPrompt';

export default function Layout() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
      <NotificationPrompt />
    </div>
  );
}
