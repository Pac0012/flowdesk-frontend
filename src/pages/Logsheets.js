import React, { useEffect, useState } from 'react';
import { logAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Modal, Field, Input, Btn, Spinner, Toast } from '../components/Shared';

export default function Logsheets() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ weekFrom: '', weekTo: '', hoursLogged: '' });
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState({ msg: '', show: false });

  const load = () => logAPI.getAll().then(r => setLogs(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showToast = msg => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  const submit = async () => {
    if (!form.weekFrom || !form.weekTo || !form.hoursLogged) return showToast('Fill all fields');
    
    const fd = new FormData();
    fd.append('weekFrom', form.weekFrom);
    fd.append('weekTo', form.weekTo);
    fd.append('hoursLogged', form.hoursLogged);
    if (file) {
      fd.append('file', file);
    }

    try {
      await logAPI.submit(fd);
      setModal(false);
      setForm({ weekFrom: '', weekTo: '', hoursLogged: '' });
      setFile(null);
      load();
      showToast('Logsheet submitted!');
    } catch (err) {
      showToast('Submission failed');
    }
  };

  const approve = async id => {
    await logAPI.approve(id);
    load();
    showToast('Logsheet approved!');
  };

  const download = async (l) => {
    if (!l.fileName) {
      return showToast('No file attached to this submission');
    }

    try {
      const response = await logAPI.download(l.id);
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanName = l.fileName ? l.fileName.replace(/^\d+_/, '') : `logsheet_${l.id}.pdf`;
      link.setAttribute('download', cleanName);
      
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('File not found on server');
    }
  };

  if (loading) return <Spinner />;

  const th = { textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', fontWeight: 500 };
  const td = { padding: '10px 14px', borderBottom: '1px solid #f9fafb' };
  const btnStyle = { background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', marginRight: 6 };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Logsheets</h1>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Weekly work log submissions</p>
        </div>
        {!isAdmin && <Btn onClick={() => setModal(true)}><i className="ti ti-upload"></i> Submit Logsheet</Btn>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>Period</th>
              <th style={th}>Submitted By</th>
              <th style={th}>Hours</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              {isAdmin && <th style={th}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ ...td, fontWeight: 500 }}>{l.weekFrom} – {l.weekTo}</td>
                <td style={td}>{l.submittedByName}</td>
                <td style={{ ...td, fontWeight: 500 }}>{l.hoursLogged}h</td>
                <td style={{ ...td, fontSize: 12, color: '#6b7280' }}>{l.submittedAt?.split('T')[0]}</td>
                <td style={td}><Badge status={l.status} /></td>
                {isAdmin && (
                  <td style={td}>
                    {l.fileName ? (
                      <button onClick={() => download(l)} style={btnStyle}>
                        <i className="ti ti-download"></i> Download
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 8 }}>No File</span>
                    )}
                    {l.status === 'PENDING' && (
                      <button onClick={() => approve(l.id)} style={btnStyle}>
                        Approve
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No logsheets yet</div>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Submit Logsheet">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Week From">
            <Input type="date" value={form.weekFrom} onChange={e => setForm({ ...form, weekFrom: e.target.value })} />
          </Field>
          <Field label="Week To">
            <Input type="date" value={form.weekTo} onChange={e => setForm({ ...form, weekTo: e.target.value })} />
          </Field>
        </div>
        <Field label="Total Hours">
          <Input type="number" value={form.hoursLogged} onChange={e => setForm({ ...form, hoursLogged: e.target.value })} placeholder="e.g. 40" min="1" max="168" />
        </Field>
        <Field label="File Attachment">
          <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13 }} />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={submit}><i className="ti ti-upload"></i> Submit</Btn>
        </div>
      </Modal>

      <Toast message={toast.msg} visible={toast.show} />
    </div>
  );
}