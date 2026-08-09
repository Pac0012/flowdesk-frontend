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
    <NavLink to={to} style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px', cursor: 'pointer', fontSize: 13, color: isActive ? '#C0392B' : 'rgba(255,255,255,0.55)', borderLeft: isActive ? '2px solid #C0392B' : '2px solid transparent', background: isActive ? 'rgba(192,57,43,0.08)' : 'transparent', textDecoration: 'none', fontWeight: isActive ? 500 : 400, transition: 'all .15s' })}>
      <i className={`ti ti-${icon}`} style={{ fontSize: 16 }}></i>{label}
    </NavLink>
  );
}

function Layout() {
  const { user, logout, isAdmin } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  const ini = user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 220, background: '#1a1a2e', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Flow<span style={{color: '#C0392B'}}>Desk</span></span>
        </div>
        
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '6px 16px 3px', textTransform: 'uppercase', letterSpacing: '.7px' }}>Main</div>
          <NavItem to="/dashboard" icon="layout-dashboard" label="Dashboard" />
          <NavItem to="/announcements" icon="bell" label="Notice Board" />
          <NavItem to="/tasks" icon="checklist" label="Tasks" />
          <NavItem to="/attendance" icon="calendar-check" label="Attendance" />
          {isAdmin && <NavItem to="/team" icon="users" label="Team" />}
        </div>

        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '6px 16px 3px', textTransform: 'uppercase', letterSpacing: '.7px' }}>Submissions</div>
          <NavItem to="/reports" icon="file-description" label="Reports" />
          <NavItem to="/logsheets" icon="clock" label="Logsheets" />
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(192,57,43,0.3)', color: '#C0392B', display: 'flex', alignItems: 'center', justifycontent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{ini}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.role === 'ADMIN' ? 'Administrator' : 'Team Member'}</div>
          </div>
          <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>
            <i className="ti ti-logout"></i>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
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
      </div>
    </div>
  );
}

function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'center', height: '100vh', background: '#0f0c29' }}><div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #C0392B', borderRadius: '50%', animation: 'spin .7s linear infinite' }}></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;
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