import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, userAPI } from '../services/api';
import { Spinner } from '../components/Shared';
import '../styles/brutal.css';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
const LANES = {
  INCOMPLETE:  { title: 'To do',       color: '#8ee8f4' },
  IN_PROGRESS: { title: 'In progress', color: '#f23d99' },
  QA_TESTING:  { title: 'QA & testing', color: '#ffb84d' },
  COMPLETED:   { title: 'Done',        color: '#6ee7a0' }
};
const LANE_ORDER = Object.keys(LANES);
const POINTS = [1, 2, 3, 5, 8, 13];
const PRIORITIES = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

const DEFAULT_SPRINTS = [
  { id: 1, name: 'Sprint 1', durationDays: 14, status: 'ACTIVE', goal: 'Core architecture & APIs' },
  { id: 2, name: 'Sprint 2', durationDays: 10, status: 'PLANNED', goal: 'UI refinement & testing' }
];

const EMPTY_FORM = {
  title: '', description: '', priority: 'MEDIUM', dueDate: '',
  assignedToId: '', storyPoints: 3, sprintId: null
};

const readStore = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
};

const initials = (name) =>
  (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const isOverdue = (task) =>
  task.dueDate && task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(new Date().toDateString());

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */
function Stars({ rating = 0, onRate }) {
  return (
    <span className="fd-stars" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`fd-star ${s <= rating ? 'on' : ''} ${onRate ? 'click' : ''}`}
          onClick={onRate ? () => onRate(s) : undefined}
          tabIndex={onRate ? 0 : -1}
          aria-label={`Rate ${s}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

function TaskCard({ task, isAdmin, onEdit, onDragStart, onDragEnd, dragging, popped, compact, onMove, onRate }) {
  const laneIdx = LANE_ORDER.indexOf(task.status);
  return (
    <div
      className={`fd-card ${dragging ? 'dragging' : ''} ${popped ? 'pop' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
    >
      <div className="fd-card-top">
        <span className={`fd-prio ${task.priority}`}>{task.priority}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="fd-sp">{task.storyPoints} SP</span>
          {isAdmin && (
            <button className="fd-icon-btn" onClick={() => onEdit(task)} title="Edit task" aria-label="Edit task">✏️</button>
          )}
        </span>
      </div>

      <h4 className="fd-card-title">{task.title}</h4>
      {!compact && task.description && (
        <p className="fd-card-desc">{task.description.substring(0, 70)}{task.description.length > 70 ? '…' : ''}</p>
      )}

      <div className="fd-card-foot">
        <span className="fd-who">
          <span className="fd-avatar">{initials(task.assignedToName)}</span>
          {task.assignedToName?.split(' ')[0] || 'Unassigned'}
        </span>
        {task.dueDate && (
          <span className={`fd-due ${isOverdue(task) ? 'late' : ''}`}>
            {isOverdue(task) ? 'Overdue ' : 'Due '}{fmtDate(task.dueDate)}
          </span>
        )}
      </div>

      {onMove && (
        <div className="fd-card-foot" style={{ borderTop: 'none', paddingTop: 6 }}>
          <span className="fd-move">
            <button className="fd-btn small" disabled={laneIdx <= 0} onClick={() => onMove(task, -1)} aria-label="Move left">←</button>
            <button className="fd-btn small" disabled={laneIdx >= LANE_ORDER.length - 1} onClick={() => onMove(task, 1)} aria-label="Move right">→</button>
          </span>
          <Stars rating={task.rating || 0} onRate={isAdmin && task.status === 'COMPLETED' ? (s) => onRate(task.id, s) : null} />
        </div>
      )}
    </div>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fd-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fd-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button className="fd-modal-x" onClick={onClose} aria-label="Close">×</button>
        <h3 className="fd-modal-title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div className="fd-field">
    <label className="fd-label">{label}</label>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Tasks() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('planning');

  const [sprints, setSprints] = useState(() => readStore('flowdesk.sprints', DEFAULT_SPRINTS));
  const [activeSprintId, setActiveSprintId] = useState(() => readStore('flowdesk.activeSprint', 1));
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintDays, setNewSprintDays] = useState(14);

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [overZone, setOverZone] = useState(null);
  const [poppedId, setPoppedId] = useState(null);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const searchRef = useRef(null);

  const [modal, setModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [backlogDraft, setBacklogDraft] = useState('');
  const [toast, setToast] = useState({ msg: '', show: false });

  useEffect(() => writeStore('flowdesk.sprints', sprints), [sprints]);
  useEffect(() => writeStore('flowdesk.activeSprint', activeSprintId), [activeSprintId]);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2400);
  }, []);

  const load = useCallback(() => {
    taskAPI
      .getAll()
      .then((r) => {
        setTasks(
          (r.data || []).map((t) => ({
            ...t,
            sprintId: t.sprintId != null ? Number(t.sprintId) : null,
            storyPoints: t.storyPoints || 3,
            status: t.status === 'NOT_STARTED' ? 'INCOMPLETE' : (t.status || 'INCOMPLETE')
          }))
        );
      })
      .catch((err) => {
        console.error('Failed to load tasks:', err);
        showToast('Could not load tasks. Check your connection and refresh.');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    load();
    if (isAdmin) userAPI.getTeam().then((r) => setTeam(r.data || []));
  }, [isAdmin, load]);

  /* ---------------- modal ---------------- */
  const openCreateModal = useCallback((title = '', sprintId = null) => {
    setEditingTaskId(null);
    setForm({ ...EMPTY_FORM, title, sprintId });
    setModal(true);
  }, []);

  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedToId: task.assignedToId || '',
      storyPoints: task.storyPoints || 3,
      sprintId: task.sprintId || null
    });
    setModal(true);
  };

  const saveTask = async () => {
    if (!form.title.trim() || !form.assignedToId) return showToast('Add a title and pick an assignee');
    try {
      const payload = {
        ...form,
        assignedToId: Number(form.assignedToId),
        storyPoints: Number(form.storyPoints) || 3,
        sprintId: form.sprintId ? Number(form.sprintId) : null
      };
      if (editingTaskId) {
        await taskAPI.update(editingTaskId, payload);
        showToast('Task updated');
      } else {
        await taskAPI.assign({ ...payload, status: 'INCOMPLETE' });
        showToast('Task added');
      }
      setModal(false);
      setBacklogDraft('');
      load();
    } catch (err) {
      showToast(editingTaskId ? 'Could not update the task. Try again.' : 'Could not create the task. Try again.');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      await taskAPI.delete(id);
      setModal(false);
      showToast('Task deleted');
      load();
    } catch (err) {
      showToast('Could not delete the task. Try again.');
    }
  };

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === 'Escape') setModal(false);
      if (['input', 'textarea', 'select'].includes(tag) || e.metaKey || e.ctrlKey) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.key === 'n' || e.key === 'N') && isAdmin) { e.preventDefault(); openCreateModal(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAdmin, openCreateModal]);

  /* ---------------- sprints ---------------- */
  const createSprint = (e) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;
    setSprints((prev) => [
      ...prev,
      { id: Date.now(), name: newSprintName.trim(), durationDays: parseInt(newSprintDays, 10) || 14, status: 'PLANNED', goal: 'Sprint milestone' }
    ]);
    showToast(`${newSprintName.trim()} created`);
    setNewSprintName('');
  };

  const startSprint = (sprintId) => {
    setSprints((prev) =>
      prev.map((s) => {
        if (Number(s.id) === Number(sprintId)) return { ...s, status: 'ACTIVE' };
        return s.status === 'ACTIVE' ? { ...s, status: 'PLANNED' } : s;
      })
    );
    setActiveSprintId(Number(sprintId));
    setActiveTab('active-sprint');
    showToast('Sprint started');
  };

  const returnToBacklog = async (ids) => {
    setTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, sprintId: null } : t)));
    try {
      await Promise.all(ids.map((id) => taskAPI.updateSprint(id, null)));
    } catch (err) {
      showToast('Some tasks did not sync. Refreshing.');
      load();
    }
  };

  const completeSprint = async (sprintId) => {
    const leftovers = tasks.filter((t) => Number(t.sprintId) === Number(sprintId) && t.status !== 'COMPLETED').map((t) => t.id);
    setSprints((prev) => prev.map((s) => (Number(s.id) === Number(sprintId) ? { ...s, status: 'DONE' } : s)));
    if (leftovers.length) await returnToBacklog(leftovers);
    showToast(leftovers.length ? `Sprint complete. ${leftovers.length} unfinished moved to backlog` : 'Sprint complete. Everything shipped!');
    setActiveTab('planning');
  };

  const deleteSprint = async (sprint) => {
    if (!window.confirm(`Delete ${sprint.name}? Its tasks go back to the backlog.`)) return;
    const ids = tasks.filter((t) => Number(t.sprintId) === Number(sprint.id)).map((t) => t.id);
    if (ids.length) await returnToBacklog(ids);
    setSprints((prev) => prev.filter((s) => s.id !== sprint.id));
    showToast(`${sprint.name} deleted`);
  };

  /* ---------------- drag and drop ---------------- */
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(Number(taskId));
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDraggedTaskId(null); setOverZone(null); };
  const zoneProps = (zoneId, onDrop) => ({
    onDragOver: (e) => { e.preventDefault(); setOverZone(zoneId); },
    onDragLeave: () => setOverZone((z) => (z === zoneId ? null : z)),
    onDrop: (e) => { setOverZone(null); onDrop(e); }
  });

  const moveToSprint = async (e, sprintId) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const id = draggedTaskId;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, sprintId } : t)));
    setDraggedTaskId(null);
    try {
      await taskAPI.updateSprint(id, sprintId);
      showToast(sprintId === null ? 'Moved to backlog' : 'Added to sprint');
    } catch (err) {
      showToast('Could not save that move. Refreshing.');
      load();
    }
  };

  const changeStatus = async (id, status) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    setPoppedId(id);
    setTimeout(() => setPoppedId(null), 600);
    try {
      await taskAPI.updateStatus(id, status);
      showToast(status === 'COMPLETED' ? 'Shipped! Nice work' : `Moved to ${LANES[status].title}`);
    } catch (err) {
      showToast('Could not save the status. Refreshing.');
      load();
    }
  };

  const dropToLane = (e, status) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const id = draggedTaskId;
    setDraggedTaskId(null);
    changeStatus(id, status);
  };

  const moveByStep = (task, dir) => {
    const next = LANE_ORDER[LANE_ORDER.indexOf(task.status) + dir];
    if (next) changeStatus(task.id, next);
  };

  const rateTask = async (id, rating) => {
    try {
      await taskAPI.rate(id, { rating, comment: '' });
      showToast('Rating saved');
      load();
    } catch (err) {
      showToast('Could not save the rating.');
    }
  };

  /* ---------------- derived data ---------------- */
  const matches = useCallback((t) => {
    const q = search.trim().toLowerCase();
    const textOk = !q || [t.title, t.description, t.assignedToName].some((v) => (v || '').toLowerCase().includes(q));
    const prioOk = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return textOk && prioOk;
  }, [search, priorityFilter]);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'COMPLETED');
    return {
      total: tasks.length,
      openSP: tasks.filter((t) => t.status !== 'COMPLETED').reduce((a, t) => a + (t.storyPoints || 0), 0),
      donePct: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0,
      overdue: tasks.filter(isOverdue).length
    };
  }, [tasks]);

  if (loading) return <Spinner />;

  const validSprintIds = sprints.map((s) => Number(s.id));
  const backlogTasks = tasks.filter((t) => (t.sprintId === null || !validSprintIds.includes(Number(t.sprintId))) && matches(t));
  const activeSprint = sprints.find((s) => Number(s.id) === Number(activeSprintId));
  const activeSprintTasks = tasks.filter((t) => Number(t.sprintId) === Number(activeSprintId) && matches(t));
  const sumSP = (list) => list.reduce((a, t) => a + (t.storyPoints || 0), 0);

  const cardProps = (task) => ({
    task, isAdmin,
    onEdit: openEditModal,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    dragging: draggedTaskId === task.id,
    popped: poppedId === task.id
  });

  /* ---------------- render ---------------- */
  return (
    <div className="fd-page">
      <div className="fd-head">
        <div>
          <h1 className="fd-title">FlowDesk<span className="fd-title-mark">Scrum board</span></h1>
          <p className="fd-sub">Plan the backlog, run sprints, and drag work across the board.</p>
        </div>
        <div className="fd-head-actions">
          <div className="fd-tabs" role="tablist">
            <button className={`fd-tab ${activeTab === 'planning' ? 'on' : ''}`} onClick={() => setActiveTab('planning')} role="tab" aria-selected={activeTab === 'planning'}>Sprint planning</button>
            <button className={`fd-tab ${activeTab === 'active-sprint' ? 'on' : ''}`} onClick={() => setActiveTab('active-sprint')} role="tab" aria-selected={activeTab === 'active-sprint'}>Active sprint</button>
          </div>
          {isAdmin && <button className="fd-btn pink" onClick={() => openCreateModal()}>+ New task</button>}
        </div>
      </div>

      <div className="fd-stats">
        <div className="fd-stat"><div className="fd-stat-num">{stats.total}</div><div className="fd-stat-label">Tasks in total</div></div>
        <div className="fd-stat"><div className="fd-stat-num">{stats.openSP}</div><div className="fd-stat-label">Story points still open</div></div>
        <div className="fd-stat"><div className="fd-stat-num">{stats.donePct}%</div><div className="fd-stat-label">Tasks done</div></div>
        <div className="fd-stat"><div className="fd-stat-num">{stats.overdue}</div><div className="fd-stat-label">Overdue</div></div>
      </div>

      <div className="fd-toolbar">
        <div className="fd-search">
          <input
            ref={searchRef}
            className="fd-input"
            placeholder="Search tasks or people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tasks"
          />
          <span className="fd-kbd">/</span>
        </div>
        {PRIORITIES.map((p) => (
          <button key={p} className={`fd-chip ${priorityFilter === p ? 'on' : ''}`} onClick={() => setPriorityFilter(p)}>
            {p === 'ALL' ? 'All priorities' : p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* ================= PLANNING ================= */}
      {activeTab === 'planning' && (
        <div className="fd-grid-plan">
          <div className="fd-panel">
            <div className="fd-panel-head">
              <div>
                <h3 className="fd-panel-title">Product backlog</h3>
                <span className="fd-panel-note">{backlogTasks.length} items waiting for a sprint</span>
              </div>
              <span className="fd-sp">{sumSP(backlogTasks)} SP</span>
            </div>

            {isAdmin && (
              <form
                onSubmit={(e) => { e.preventDefault(); if (backlogDraft.trim()) openCreateModal(backlogDraft.trim()); }}
                style={{ display: 'flex', gap: 8, marginBottom: 12 }}
              >
                <input className="fd-input" placeholder="Quick add: type a title, press Enter" value={backlogDraft} onChange={(e) => setBacklogDraft(e.target.value)} />
                <button className="fd-btn cyan" type="submit">Add</button>
              </form>
            )}

            <div className={`fd-drop tall ${overZone === 'backlog' ? 'over' : ''}`} {...zoneProps('backlog', (e) => moveToSprint(e, null))}>
              {!backlogTasks.length ? (
                <div className="fd-empty">
                  {search || priorityFilter !== 'ALL' ? 'No backlog items match your filters.' : 'The backlog is empty. Add a task to get started.'}
                  {isAdmin && !search && priorityFilter === 'ALL' && <div><button className="fd-btn pink" onClick={() => openCreateModal()}>+ New task</button></div>}
                </div>
              ) : (
                backlogTasks.map((task) => <TaskCard key={task.id} {...cardProps(task)} />)
              )}
            </div>
          </div>

          <div>
            <form onSubmit={createSprint} className="fd-panel" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="fd-input" style={{ flex: 1, minWidth: 160 }} placeholder="New sprint name" value={newSprintName} onChange={(e) => setNewSprintName(e.target.value)} />
              <input className="fd-input" style={{ width: 80 }} type="number" min="1" value={newSprintDays} onChange={(e) => setNewSprintDays(e.target.value)} aria-label="Sprint length in days" />
              <span className="fd-panel-note">days</span>
              <button className="fd-btn pink" type="submit">Add sprint</button>
            </form>

            {sprints.map((s) => {
              const list = tasks.filter((t) => Number(t.sprintId) === Number(s.id) && matches(t));
              const all = tasks.filter((t) => Number(t.sprintId) === Number(s.id));
              const totalSP = sumSP(all);
              const doneSP = sumSP(all.filter((t) => t.status === 'COMPLETED'));
              const pct = totalSP ? Math.round((doneSP / totalSP) * 100) : 0;

              return (
                <div className="fd-panel" key={s.id}>
                  <div className="fd-panel-head">
                    <div>
                      <h3 className="fd-panel-title">
                        {s.name}<span className={`fd-status-tag ${s.status}`}>{s.status === 'DONE' ? 'DONE' : s.status}</span>
                      </h3>
                      <span className="fd-panel-note">{s.durationDays} days · {s.goal}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="fd-sp">{doneSP}/{totalSP} SP</span>
                      {s.status !== 'DONE' && (
                        s.status === 'ACTIVE'
                          ? <button className="fd-btn small green" onClick={() => completeSprint(s.id)}>Complete sprint</button>
                          : <button className="fd-btn small cyan" onClick={() => startSprint(s.id)}>Start sprint</button>
                      )}
                      <button className="fd-btn small" onClick={() => deleteSprint(s)} aria-label={`Delete ${s.name}`}>Delete</button>
                    </div>
                  </div>

                  <div className="fd-progress" aria-label={`${pct}% complete`}><span style={{ width: `${pct}%` }} /></div>

                  <div className={`fd-drop ${overZone === `sprint-${s.id}` ? 'over' : ''}`} {...zoneProps(`sprint-${s.id}`, (e) => moveToSprint(e, Number(s.id)))}>
                    {!list.length ? (
                      <div className="fd-empty">Drag backlog tasks here</div>
                    ) : (
                      list.map((task) => <TaskCard key={task.id} {...cardProps(task)} compact />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= ACTIVE SPRINT ================= */}
      {activeTab === 'active-sprint' && (
        <div>
          <div className="fd-panel" style={{ marginBottom: '1.25rem' }}>
            <div className="fd-panel-head" style={{ marginBottom: 8 }}>
              <div>
                <h3 className="fd-panel-title">{activeSprint?.name || 'No sprint selected'}</h3>
                <span className="fd-panel-note">{activeSprint ? `${activeSprint.durationDays} days · ${activeSprint.goal}` : 'Pick a sprint in planning and press Start sprint'}</span>
              </div>
              {activeSprint && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="fd-sp">{sumSP(activeSprintTasks)} SP on board</span>
                  {activeSprint.status === 'ACTIVE' && <button className="fd-btn small green" onClick={() => completeSprint(activeSprint.id)}>Complete sprint</button>}
                </div>
              )}
            </div>
          </div>

          <div className="fd-kanban">
            {LANE_ORDER.map((columnId) => {
              const lane = LANES[columnId];
              const laneTasks = activeSprintTasks.filter((t) => (t.status || 'INCOMPLETE') === columnId);
              return (
                <div className="fd-lane" key={columnId}>
                  <div className="fd-lane-head" style={{ background: lane.color }}>
                    <span>{lane.title}</span>
                    <span className="fd-lane-count">{laneTasks.length}</span>
                  </div>
                  <div className={`fd-drop ${overZone === columnId ? 'over' : ''}`} {...zoneProps(columnId, (e) => dropToLane(e, columnId))}>
                    {!laneTasks.length && <div className="fd-empty">Nothing here yet</div>}
                    {laneTasks.map((task) => (
                      <TaskCard key={task.id} {...cardProps(task)} onMove={moveByStep} onRate={rateTask} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL ================= */}
      <Modal open={modal} onClose={() => setModal(false)} title={editingTaskId ? 'Edit task' : 'New task'}>
        <Field label="Title">
          <input className="fd-input" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" />
        </Field>
        <div className="fd-row">
          <Field label="Assign to">
            <select className="fd-select" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
              <option value="">Select a team member</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input className="fd-input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Story points">
          <div className="fd-points">
            {POINTS.map((p) => (
              <button type="button" key={p} className={`fd-chip ${Number(form.storyPoints) === p ? 'on' : ''}`} onClick={() => setForm({ ...form, storyPoints: p })}>{p}</button>
            ))}
          </div>
        </Field>
        <div className="fd-row">
          <Field label="Priority">
            <select className="fd-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
          <Field label="Sprint">
            <select className="fd-select" value={form.sprintId || ''} onChange={(e) => setForm({ ...form, sprintId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Backlog (no sprint)</option>
              {sprints.filter((s) => s.status !== 'DONE').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea className="fd-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Acceptance criteria, links, notes" />
        </Field>
        <div className="fd-modal-foot">
          {editingTaskId && isAdmin ? <button className="fd-btn danger" onClick={() => deleteTask(editingTaskId)}>Delete task</button> : <span />}
          <span style={{ display: 'flex', gap: 8 }}>
            <button className="fd-btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="fd-btn pink" onClick={saveTask}>{editingTaskId ? 'Save changes' : 'Add task'}</button>
          </span>
        </div>
      </Modal>

      <div className={`fd-toast ${toast.show ? 'show' : ''}`} role="status">{toast.msg}</div>
    </div>
  );
}