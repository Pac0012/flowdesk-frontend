import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import '../styles/brutal.css';

const DEMOS = [
  { role: 'Admin', name: 'Owethu Mabeloane', email: 'owethu@flowdesk.io', pass: 'Password123!' },
  { role: 'DevOps', name: 'Percy Thotse', email: 'percy@flowdesk.io', pass: 'Password123!' },
  { role: 'Developer', name: 'Modipadi', email: 'modipadi@flowdesk.io', pass: 'Password123!' }
];

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

  const persistAndGo = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('fd_token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    if (setUser) setUser(data);
    window.location.href = '/tasks';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      persistAndGo(res.data);
    } catch (err) {
      console.error('Login error details:', err.response?.data || err.message);
      setError('That email or password did not match our records.');
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
      persistAndGo(res.data);
    } catch (err) {
      setError('Could not create the account. That email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d) => {
    setIsSignup(false);
    setEmail(d.email);
    setPassword(d.pass);
    setError('');
  };

  return (
    <div className="fd-page fd-login-page">
      <div className="fd-login-decor" aria-hidden="true">
        <span className="fd-login-spark one">✦</span>
        <span className="fd-login-spark two">✦</span>
        <span className="fd-login-speech">GO TEAM!</span>
      </div>

      <div className="fd-login-wrap">
        <div className="fd-login-brand">
          <h1 className="fd-title">Flow<span className="fd-title-mark">Desk</span></h1>
          <p className="fd-sub">Agile scrum and distributed task management, built for teams who ship.</p>
        </div>

        <div className="fd-panel fd-login-card">
          <div className="fd-tabs fd-login-tabs" role="tablist">
            <button
              type="button"
              className={`fd-tab ${!isSignup ? 'on' : ''}`}
              onClick={() => { setIsSignup(false); setError(''); }}
              role="tab"
              aria-selected={!isSignup}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`fd-tab ${isSignup ? 'on' : ''}`}
              onClick={() => { setIsSignup(true); setError(''); }}
              role="tab"
              aria-selected={isSignup}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={isSignup ? handleSignup : handleLogin}>
            {isSignup && (
              <div className="fd-row">
                <div className="fd-field">
                  <label className="fd-label">Full name</label>
                  <input className="fd-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Owethu Mabeloane" required />
                </div>
                <div className="fd-field">
                  <label className="fd-label">Job title</label>
                  <input className="fd-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Full-Stack Developer" />
                </div>
              </div>
            )}

            <div className="fd-field">
              <label className="fd-label">Email address</label>
              <input className="fd-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@flowdesk.io" required />
            </div>

            <div className="fd-field">
              <label className="fd-label">Password</label>
              <input className="fd-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && <div className="fd-alert">{error}</div>}

            <button type="submit" className="fd-btn pink fd-login-submit" disabled={loading}>
              {loading ? 'Working…' : isSignup ? 'Create account' : 'Sign in to FlowDesk'}
            </button>

            <p className="fd-login-switch">
              {isSignup ? (
                <>Already registered? <button type="button" className="fd-linklike" onClick={() => { setIsSignup(false); setError(''); }}>Sign in</button></>
              ) : (
                <>Need an account? <button type="button" className="fd-linklike pink" onClick={() => { setIsSignup(true); setError(''); }}>Sign up</button></>
              )}
            </p>
          </form>

          <div className="fd-login-demos">
            <p className="fd-panel-note fd-login-demos-title">Quick team fill</p>
            {DEMOS.map((d) => (
              <button type="button" key={d.email} className="fd-demo-row" onClick={() => fillDemo(d)}>
                <span>
                  <span className={`fd-demo-role ${d.role === 'Admin' ? 'admin' : ''}`}>{d.role}</span>
                  {d.email}
                </span>
                <span className="fd-demo-hint">click to fill</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}