import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const data = res.data;

      // Save token and user object immediately
      localStorage.setItem('token', data.token);
      localStorage.setItem('fd_token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      if (setUser) setUser(data);

      // Force full load into tasks
      window.location.href = '/tasks';
    } catch (err) {
      console.error('Login error details:', err.response?.data || err.message);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register({ email, password, fullName, jobTitle, role: 'MEMBER' });
      const res = await authAPI.login({ email, password });
      const data = res.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem('fd_token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      if (setUser) setUser(data);

      window.location.href = '/tasks';
    } catch (err) {
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const demos = [
    { role: 'Admin', name: 'Owethu Mabeloane', email: 'owethu@flowdesk.io', pass: 'Password123!' },
    { role: 'DevOps', name: 'Percy Thotse', email: 'percy@flowdesk.io', pass: 'Password123!' },
    { role: 'Developer', name: 'Modipadi', email: 'modipadi@flowdesk.io', pass: 'Password123!' }
  ];

  const inp = {
    width: '100%',
    padding: '11px 14px',
    background: '#090D16',
    border: '1px solid #1e293b',
    borderRadius: 10,
    color: '#f8fafc',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #111a2e 0%, #090D16 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(17, 23, 38, 0.85)',
          border: '1px solid #1e293b',
          borderRadius: 20,
          padding: '2.5rem',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Flow<span style={{ color: '#38bdf8' }}>Desk</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            Agile Scrum & Distributed Task Management
          </p>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin}>
          {isSignup && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Owethu Mabeloane"
                required
                style={inp}
              />
            </div>
          )}

          {isSignup && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Job Title
              </label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Full-Stack Developer"
                style={inp}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@flowdesk.io"
              required
              style={inp}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inp}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#f472b6',
                padding: '9px 14px',
                borderRadius: 8,
                fontSize: 12,
                marginBottom: '1rem',
                fontWeight: 500
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              border: 'none',
              borderRadius: 10,
              color: '#04101e',
              fontSize: 13,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 20px rgba(56, 189, 248, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : isSignup ? 'Create Account' : 'Sign in to FlowDesk'}
          </button>

          <p
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            style={{
              color: '#94a3b8',
              fontSize: 12,
              textAlign: 'center',
              marginTop: '1.25rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {isSignup ? (
              <span>Already registered? <strong style={{ color: '#38bdf8' }}>Sign in</strong></span>
            ) : (
              <span>Need an account? <strong style={{ color: '#ec4899' }}>Sign up</strong></span>
            )}
          </p>
        </form>

        <div style={{ marginTop: '1.75rem', padding: '1rem', background: '#090D16', borderRadius: 12, border: '1px solid #1e293b' }}>
          <p style={{ fontSize: 10, color: '#64748b', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Quick Team Fill
          </p>
          {demos.map((d) => (
            <div
              key={d.email}
              onClick={() => {
                setEmail(d.email);
                setPassword(d.pass);
              }}
              style={{
                cursor: 'pointer',
                padding: '8px 10px',
                borderRadius: 8,
                background: '#111726',
                border: '1px solid #1e293b',
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>
                <span
                  style={{
                    color: d.role === 'Admin' ? '#38bdf8' : '#ec4899',
                    fontWeight: 700,
                    marginRight: 6
                  }}
                >
                  {d.role}
                </span>
                {d.email}
              </span>
              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>click to fill</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}