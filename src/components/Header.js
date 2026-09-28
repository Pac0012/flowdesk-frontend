import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Attendance', path: '/attendance' },
    { name: 'Team', path: '/team' },
    { name: 'Reports', path: '/reports' },
    { name: 'Logsheets', path: '/logsheets' },
    { name: 'Notice Board', path: '/announcements' }
  ];

  return (
    <header style={{
      background: '#fff',
      borderBottom: '3px solid #000',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0px 4px 0px #000',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          background: '#ffde59',
          border: '2px solid #000',
          padding: '6px 12px',
          fontWeight: 800,
          fontSize: '1rem',
          boxShadow: '2px 2px 0px #000',
          borderRadius: '6px'
        }}>
          FD
        </span>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          FlowDesk
        </h2>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                background: isActive ? '#ffde59' : '#fff',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '6px 14px',
                border: '2px solid #000',
                borderRadius: '6px',
                boxShadow: isActive ? '2px 2px 0px #000' : 'none',
                transition: 'all 0.1s ease'
              }}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000' }}>
          👤 {user?.fullName || user?.email || 'User'}
        </div>
        <button
          onClick={logout}
          style={{
            background: '#ff914d',
            color: '#000',
            border: '2px solid #000',
            fontWeight: 800,
            fontSize: '0.78rem',
            padding: '6px 12px',
            borderRadius: '6px',
            boxShadow: '2px 2px 0px #000',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}