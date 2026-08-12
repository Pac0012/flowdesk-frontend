import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { announcementAPI } from '../services/api';
import { Card, CardHeader, Badge, Btn, Spinner, Toast, Modal, Field, Input, Textarea, Select } from '../components/Shared';

export default function Announcements() {
  const { isAdmin, user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState({ msg: '', show: false });
  const [form, setForm] = useState({ title: '', content: '', priority: 'MEDIUM' });

  const loadAnnouncements = async () => {
    try {
      const res = await announcementAPI.getAll();
      setNotices(res.data);
    } catch (err) {
      showToast('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const showToast = msg => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  const handlePost = async () => {
    if (!form.title || !form.content) return showToast('Please fill in all fields');
    try {
      await announcementAPI.create({
        title: form.title,
        message: form.content,
        category: form.priority,
        authorId: user.id
      });
      setModal(false);
      setForm({ title: '', content: '', priority: 'MEDIUM' });
      showToast('Announcement broadcasted successfully!');
      loadAnnouncements();
    } catch (err) {
      showToast('Failed to post announcement.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await announcementAPI.delete(id);
      showToast('Notice removed.');
      loadAnnouncements();
    } catch (err) {
      showToast('Failed to delete notice.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Notice Board</h1>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Important updates and community broadcasts</p>
        </div>
        {isAdmin && (
          <Btn onClick={() => setModal(true)}>
            Post Notice
          </Btn>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {notices.map(n => (
          <Card key={n.id} style={{ padding: '1.25rem', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>{n.title}</h3>
                <Badge status={n.category} />
              </div>
              {isAdmin && (
                <button 
                  onClick={() => handleDelete(n.id)} 
                  style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 }}
                >
                  ×
                </button>
              )}
            </div>

            <p style={{ color: '#374151', fontSize: 13, lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
              {n.message}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', fontSize: 11, color: '#6b7280' }}>
              <span>By <strong style={{ color: '#1c1c2e' }}>User #{n.authorId}</strong></span>
              <span>{new Date(n.createdAt).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}

        {!notices.length && (
          <Card style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            No active announcements found.
          </Card>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Broadcast New Notice">
        <Field label="Notice Title">
          <Input 
            value={form.title} 
            onChange={e => setForm({ ...form, title: e.target.value })} 
            placeholder="e.g., System Maintenance Schedule" 
          />
        </Field>

        <Field label="Priority Level">
          <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option value="HIGH">High (Urgent Announcement)</option>
            <option value="MEDIUM">Medium (General Update)</option>
            <option value="LOW">Low (Casual Notice)</option>
          </Select>
        </Field>

        <Field label="Notice Message Details">
          <Textarea 
            value={form.content} 
            onChange={e => setForm({ ...form, content: e.target.value })} 
            placeholder="Write out your complete message block here..." 
          />
        </Field>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={handlePost}>Broadcast</Btn>
        </div>
      </Modal>

      <Toast message={toast.msg} visible={toast.show} />
    </div>
  );
}