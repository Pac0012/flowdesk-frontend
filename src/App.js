import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Logsheets from './pages/Logsheets';
import Attendance from './pages/Attendance';
import Announcements from './pages/Announcements';

function NavItem({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        padding: '6px 14px', 
        fontSize: 13, 
        color: '#000', 
        background: isActive ? '#ffde59' : '#fff', 
        border: '2px solid #000', 
        borderRadius: 6,
        textDecoration: 'none', 
        fontWeight: 800, 
        boxShadow: isActive ? '2px 2px 0px #000' : 'none',
        transition: 'all 0.1s ease' 
      })}
    >
      <i className={`ti ti-${icon}`} style={{ fontSize: 15 }}></i>{label}
    </NavLink>
  );
}

function Layout() {
  const { user, logout, isAdmin } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  const ini = user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fffdf0' }}>
      
      {/* Neo-Brutalist Top Header Navbar */}
      <header style={{ 
        background: '#fff', 
        borderBottom: '3px solid #000', 
        padding: '0.85rem 2rem', 
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
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ 
            background: '#ffde59', 
            border: '2px solid #000', 
            padding: '4px 10px', 
            fontWeight: 800, 
            fontSize: 14, 
            boxShadow: '2px 2px 0px #000', 
            borderRadius: 6 
          }}>
            FD
          </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#000', letterSpacing: '-0.02em' }}>
            Flow<span style={{ color: '#ec4899' }}>Desk</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <NavItem to="/dashboard" icon="layout-dashboard" label="Dashboard" />
          <NavItem to="/announcements" icon="bell" label="Notice Board" />
          <NavItem to="/tasks" icon="checklist" label="Tasks" />
          <NavItem to="/attendance" icon="calendar-check" label="Attendance" />
          {isAdmin && <NavItem to="/team" icon="users" label="Team" />}
          <NavItem to="/reports" icon="file-description" label="Reports" />
          <NavItem to="/logsheets" icon="clock" label="Logsheets" />
        </nav>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffdf0', border: '2px solid #000', padding: '4px 10px', borderRadius: 8, boxShadow: '2px 2px 0px #000' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ffde59', border: '1.5px solid #000', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
              {ini}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#000', lineHeight: 1.2 }}>{user.fullName}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#475569' }}>{user.role === 'ADMIN' ? 'Admin' : 'Member'}</div>
            </div>
          </div>
          <button 
            onClick={logout} 
            title="Sign out" 
            style={{ 
              background: '#ff914d', 
              border: '2px solid #000', 
              color: '#000', 
              cursor: 'pointer', 
              fontSize: 14, 
              fontWeight: 800,
              padding: '6px 12px',
              borderRadius: 6,
              boxShadow: '2px 2px 0px #000'
            }}
          >
            <i className="ti ti-logout"></i>
          </button>
        </div>
      </header>

      {/* Main Content View Area */}
      <main style={{ flex: 1, overflow: 'auto', background: '#fffdf0' }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/attendance" element={<Attendance />} />
          {isAdmin && <Route path="/team" element={<Team />} />}
          <Route path="/reports" element={<Reports />} />
          <Route path="/logsheets" element={<Logsheets />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

    </div>
  );
}

function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#090D16' }}><div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #ffde59', borderRadius: '50%', animation: 'spin .7s linear infinite' }}></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthGuard />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}