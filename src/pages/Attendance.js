import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { Card, CardHeader, Badge, Btn, Spinner, Toast, Avatar } from '../components/Shared';

export default function Attendance() {
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: '', show: false });

  // Member-specific states
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [personalHistory, setPersonalHistory] = useState([]);

  // Admin-specific state
  const [adminLog, setAdminLog] = useState([]);

  const loadAttendanceData = async () => {
    try {
      if (isAdmin) {
        // Admin View: Fetch complete team register logs
        const res = await attendanceAPI.getAdminMasterLog();
        setAdminLog(res.data);
      } else {
        // Member View: Fetch individual daily status and personal logs
        const [statusRes, historyRes] = await Promise.all([
          attendanceAPI.getTodayStatus(),
          attendanceAPI.getHistory()
        ]);
        const hasAttended = statusRes.data.some(
            record => record.userId === user?.userId
        );

        setHasAttendedToday(hasAttended);
        setPersonalHistory(
            historyRes.data.filter(record => record.userId === user?.userId)
        );
      }
    } catch (err) {
      showToast('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAttendanceData(); }, [isAdmin]);

  const showToast = msg => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      await attendanceAPI.checkIn(user.userId);
      setHasAttendedToday(true);
      showToast('Attendance successfully marked for today!');
      loadAttendanceData();
    } catch (err) {
      showToast('Error registering attendance. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  const th = { textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', fontWeight: 500 };
  const td = { padding: '12px 14px', borderBottom: '1px solid #f9fafb' };

  // ==================== 1. ADMINISTRATOR VIEW ====================
  if (isAdmin) {
    // Helper logic to dynamically group the flat backend log array by date
    const groupedRecords = adminLog.reduce((groups, record) => {
      const date = record.date; // Expects a standard date string structure: e.g., '2026-06-14'
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {});

    // Sort dates so the most recent calendar date appears at the top
    const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a));

    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Daily Attendance Monitor</h1>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Track member register activity across program dates</p>
        </div>

        {!sortedDates.length ? (
          <Card style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            No team members have marked attendance yet.
          </Card>
        ) : (
          sortedDates.map(dateStr => {
            const displayDate = new Date(dateStr).toLocaleDateString('en-ZA', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            const recordsForDay = groupedRecords[dateStr];

            return (
              <Card key={dateStr} style={{ marginBottom: '2rem' }}>
                <CardHeader 
                  title={displayDate}
                  action={<span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{recordsForDay.filter(record => record.status === 'PRESENT').length} Present</span>}
                />
                <div style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, width: '40%' }}>Team Member</th>
                        <th style={{ ...th, width: '40%' }}>Job Title</th>
                        <th style={{ ...th, width: '20%' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsForDay.map(record => (
                        <tr key={record.id}>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <Avatar name={record.memberName} size={28} />
                              <div>
                                <div style={{ fontWeight: 500 }}>{record.memberName}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.memberEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...td, color: '#6b7280' }}>{record.jobTitle || '—'}</td>
                          <td style={td}><Badge status={record.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })
        )}
        <Toast message={toast.msg} visible={toast.show} />
      </div>
    );
  }

  // ==================== 2. STANDARD MEMBER VIEW ====================
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Attendance Register</h1>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Track your daily workspace attendance</p>
      </div>

      <Card style={{ marginBottom: '1.5rem', padding: '1.5rem', textAlign: 'center', background: '#fff' }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: '0.5rem' }}>
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: '1.25rem' }}>
          {hasAttendedToday 
            ? "Thank you! Your presence has been successfully recorded for today." 
            : "You have not signed the attendance register for today yet."}
        </p>
        <Btn 
          onClick={handleCheckIn} 
          disabled={hasAttendedToday || submitting}
          variant={hasAttendedToday ? 'success' : 'primary'}
          style={{ padding: '12px 32px', fontSize: 14 }}
        >
          {submitting ? 'Signing...' : hasAttendedToday ? '✓ Checked In Today' : 'Mark Present'}
        </Btn>
      </Card>

      <Card>
        <CardHeader title="Your Attendance History Log" />
        <div style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>Date Entered</th>
                <th style={th}>Status Flag</th>
              </tr>
            </thead>
            <tbody>
              {personalHistory.map(record => (
                <tr key={record.id}>
                  <td style={{ ...td, fontWeight: 500 }}>{record.date}</td>
                  <td style={td}><Badge status={record.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!personalHistory.length && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
              No attendance records found yet.
            </div>
          )}
        </div>
      </Card>

      <Toast message={toast.msg} visible={toast.show} />
    </div>
  );
}