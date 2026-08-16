import React, { useEffect, useState } from 'react';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Modal, Field, Input, Btn, Spinner, Toast } from '../components/Shared';

export default function Reports() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    reportMonth: new Date().toISOString().slice(0, 7) // Defaults to current YYYY-MM
  });
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState({ msg: '', show: false });

  // Converts YYYY-MM into full word format (e.g. "2026-08" -> "August 2026")
  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    if (!year || !month) return monthStr;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const load = () => reportAPI.getAll().then(r => setReports(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showToast = msg => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  const submit = async () => {
    if (!form.title) return showToast('Enter a title');
    if (!form.reportMonth) return showToast('Select a month');
    
    const formattedMonth = formatMonthName(form.reportMonth);

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('reportMonth', formattedMonth);
    if (file) {
      fd.append('file', file);
    }

    try {
      await reportAPI.submit(fd);
      setModal(false);
      setForm({ 
        title: '', 
        reportMonth: new Date().toISOString().slice(0, 7) 
      });
      setFile(null);
      load();
      showToast('Report submitted successfully!');
    } catch (err) {
      showToast('Upload failed');
    }
  };

  const review = async id => {
    await reportAPI.review(id, { comment: 'Reviewed' });
    load();
    showToast('Marked as reviewed');
  };

  const download = async (id, fileName) => {
    try {
      const response = await reportAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const cleanName = fileName ? fileName.replace(/^\d+_/, '') : `report_${id}.pdf`;
      link.setAttribute('download', cleanName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Could not download file (No file uploaded for this report)');
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
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Reports</h1>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Monthly progress reports</p>
        </div>
        {!isAdmin && <Btn onClick={() => setModal(true)}><i className="ti ti-upload"></i> Upload Report</Btn>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Submitted By</th>
              <th style={th}>Month</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              {isAdmin && <th style={th}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td style={{ ...td, fontWeight: 500 }}>{r.title}</td>
                <td style={td}>{r.submittedByName}</td>
                <td style={{ ...td, color: '#6b7280' }}>{r.reportMonth}</td>
                <td style={{ ...td, fontSize: 12, color: '#6b7280' }}>{r.submittedAt?.split('T')[0]}</td>
                <td style={td}><Badge status={r.status} /></td>
                {isAdmin && (
                  <td style={td}>
                    <button onClick={() => download(r.id, r.fileName)} style={btnStyle}>
                      <i className="ti ti-download"></i> Download
                    </button>
                    {r.status === 'PENDING' && (
                      <button onClick={() => review(r.id)} style={btnStyle}>
                        Review
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!reports.length && <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No reports yet</div>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Upload Monthly Report">
        <Field label="Report Title">
          <Input 
            value={form.title} 
            onChange={e => setForm({ ...form, title: e.target.value })} 
            placeholder="e.g. Monthly Progress Report" 
          />
        </Field>
        
        <Field label="Month & Year">
          <Input 
            type="month" 
            value={form.reportMonth} 
            onChange={e => setForm({ ...form, reportMonth: e.target.value })} 
          />
        </Field>

        <Field label="File">
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