import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, userAPI } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalTasks: 0, completed: 0, points: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([taskAPI.getAll(), userAPI.getTeam?.() || Promise.resolve({ data: [] })])
      .then(([taskRes]) => {
        const tasks = taskRes.data || [];
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        setStats({
          totalTasks: tasks.length,
          completed,
          points: tasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0)
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Welcome Banner */}
      <div style={{
        background: '#ffde59',
        border: '3px solid #000',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '5px 5px 0px #000',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#000', margin: 0, letterSpacing: '-0.03em' }}>
            Welcome back, {user?.fullName || 'Developer'}! 👋
          </h1>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rum' }}>
            {user?.jobTitle || 'Full-Stack Developer'} · FlowDesk Agile Command Center
          </p>
        </div>
        <div style={{
          background: '#fff',
          border: '2px solid #000',
          padding: '10px 18px',
          borderRadius: '10px',
          boxShadow: '3px 3px 0px #000',
          fontWeight: 800,
          fontSize: '0.9rem'
        }}>
          🚀 Sprint Active
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: '#fff', border: '3px solid #000', borderRadius: '14px', padding: '1.5rem', boxShadow: '4px 4px 0px #000' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Total Backlog Tasks</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#000', marginTop: '0.5rem' }}>{stats.totalTasks}</div>
        </div>
        <div style={{ background: '#fff', border: '3px solid #000', borderRadius: '14px', padding: '1.5rem', boxShadow: '4px 4px 0px #000' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Completed Stories</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', marginTop: '0.5rem' }}>{stats.completed}</div>
        </div>
        <div style={{ background: '#fff', border: '3px solid #000', borderRadius: '14px', padding: '1.5rem', boxShadow: '4px 4px 0px #000' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Total Story Points</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#db2777', marginTop: '0.5rem' }}>{stats.points} SP</div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div style={{ background: '#fff', border: '3px solid #000', borderRadius: '16px', padding: '2rem', boxShadow: '4px 4px 0px #000' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1rem', color: '#000' }}>⚡ Quick Workflow Shortcuts</h3>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '1.5rem' }}>
          Jump straight into agile planning, check your logsheets, or review team updates using the neo-brutalist header navigation above.
        </p>
        <a href="/tasks" style={{
          display: 'inline-block',
          background: '#ffde59',
          color: '#000',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '2px solid #000',
          fontWeight: 900,
          textDecoration: 'none',
          boxShadow: '3px 3px 0px #000'
        }}>
          Open Scrum Board &rarr;
        </a>
      </div>
    </div>
  );
}