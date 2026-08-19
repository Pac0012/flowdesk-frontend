import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, userAPI } from '../services/api';
import { Badge, Stars, Avatar, Modal, Field, Input, Select, Btn, Spinner, Toast } from '../components/Shared';

const KANBAN_LANES = {
  INCOMPLETE: { title: 'Incomplete', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)' },
  IN_PROGRESS: { title: 'In Progress', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)' },
  QA_TESTING: { title: 'QA & Testing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  COMPLETED: { title: 'Complete', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' }
};

export default function Tasks() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('planning'); // 'planning' | 'active-sprint'

  const [sprints, setSprints] = useState([
    { id: 1, name: 'Sprint 1', durationDays: 14, status: 'PLANNED', goal: 'Core Architecture & APIs' },
    { id: 2, name: 'Sprint 2', durationDays: 10, status: 'PLANNED', goal: 'UI Refinement & Testing' }
  ]);
  const [activeSprintId, setActiveSprintId] = useState(1);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintDays, setNewSprintDays] = useState(14);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
    storyPoints: 3
  });
  const [toast, setToast] = useState({ msg: '', show: false });

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const load = () => {
    taskAPI
      .getAll()
      .then((r) => {
        setTasks(
          r.data.map((t) => ({
            ...t,
            sprintId: t.sprintId || null,
            storyPoints: t.storyPoints || 3,
            status: t.status === 'NOT_STARTED' ? 'INCOMPLETE' : t.status
          }))
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) userAPI.getTeam().then((r) => setTeam(r.data));
  }, [isAdmin]);

  const assignTask = async () => {
    if (!form.title || !form.assignedToId) return showToast('Please provide a title and assignee');
    try {
      await taskAPI.assign({
        ...form,
        assignedToId: Number(form.assignedToId),
        storyPoints: Number(form.storyPoints) || 3,
        status: 'INCOMPLETE'
      });
      setModal(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToId: '', storyPoints: 3 });
      load();
      showToast('Task added to Backlog!');
    } catch (err) {
      showToast('Failed to assign task');
    }
  };

  const createSprint = (e) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;
    const newSprint = {
      id: Date.now(),
      name: newSprintName,
      durationDays: parseInt(newSprintDays) || 14,
      status: 'PLANNED',
      goal: 'Sprint Milestone'
    };
    setSprints((prev) => [...prev, newSprint]);
    setNewSprintName('');
    showToast(`Created ${newSprintName}`);
  };

  const startSprint = (sprintId) => {
    setSprints(sprints.map((s) => (s.id === sprintId ? { ...s, status: 'ACTIVE' } : s)));
    setActiveSprintId(sprintId);
    setActiveTab('active-sprint');
    showToast('Sprint started!');
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', String(taskId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropToBacklog = (e) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    setTasks((prev) => prev.map((t) => (t.id === draggedTaskId ? { ...t, sprintId: null } : t)));
    setDraggedTaskId(null);
    showToast('Moved back to Product Backlog');
  };

  const handleDropToSprint = (e, targetSprintId) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    setTasks((prev) => prev.map((t) => (t.id === draggedTaskId ? { ...t, sprintId: targetSprintId } : t)));
    setDraggedTaskId(null);
    showToast('Moved to Sprint');
  };

  const handleDropToLane = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    setTasks((prev) => prev.map((t) => (t.id === draggedTaskId ? { ...t, status: targetStatus } : t)));

    try {
      await taskAPI.updateStatus(draggedTaskId, targetStatus);
      showToast(`Status updated to ${KANBAN_LANES[targetStatus]?.title || targetStatus}`);
    } catch (err) {
      showToast('Error syncing status');
      load();
    } finally {
      setDraggedTaskId(null);
    }
  };

  const rateTask = async (id, rating) => {
    await taskAPI.rate(id, { rating, comment: '' });
    load();
  };

  if (loading) return <Spinner />;

  const backlogTasks = tasks.filter((t) => !t.sprintId);
  const activeSprint = sprints.find((s) => s.id === activeSprintId);
  const activeSprintTasks = tasks.filter((t) => t.sprintId === activeSprintId);

  return (
    <div style={{ padding: '1.75rem', background: '#090D16', minHeight: '100vh', color: '#f1f5f9' }}>
      
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            FlowDesk <span style={{ color: '#38bdf8', fontWeight: 400 }}>Scrum Board</span>
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Manage product backlog velocity, sprint planning, and interactive workflow execution
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: '#111726', padding: 4, borderRadius: 10, border: '1px solid #1e293b' }}>
            <button
              onClick={() => setActiveTab('planning')}
              style={{
                background: activeTab === 'planning' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
                color: activeTab === 'planning' ? '#04101e' : '#94a3b8',
                fontWeight: 700,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Sprint Planning
            </button>
            <button
              onClick={() => setActiveTab('active-sprint')}
              style={{
                background: activeTab === 'active-sprint' ? 'linear-gradient(135deg, #db2777, #ec4899)' : 'transparent',
                color: activeTab === 'active-sprint' ? '#fff' : '#94a3b8',
                fontWeight: 700,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Active Sprint
            </button>
          </div>

          {isAdmin && (
            <Btn onClick={() => setModal(true)} style={{ background: '#38bdf8', color: '#090D16', fontWeight: 700 }}>
              <i className="ti ti-plus"></i> New Task
            </Btn>
          )}
        </div>
      </div>

      {/* ===================== VIEW 1: PLANNING ===================== */}
      {activeTab === 'planning' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
          
          {/* Backlog Column */}
          <div style={{ background: '#111726', border: '1px solid #1e293b', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', margin: 0 }}>
                  Product Backlog
                </h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>{backlogTasks.length} unassigned items</span>
              </div>
              <span style={{ fontSize: 11, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                {backlogTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} SP
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDropToBacklog}
              style={{
                flex: 1,
                minHeight: 480,
                background: '#090D16',
                border: '1px dashed #1e293b',
                borderRadius: 10,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              {!backlogTasks.length ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#475569', fontSize: 12 }}>
                  Backlog is clear. Click "+ New Task" to create items.
                </div>
              ) : (
                backlogTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    style={{
                      background: '#141c2e',
                      border: '1px solid #243048',
                      borderRadius: 10,
                      padding: 12,
                      color: '#f8fafc',
                      cursor: 'grab'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</span>
                      <span style={{ fontSize: 10, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                        {task.storyPoints} SP
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{task.description?.substring(0, 50)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, borderTop: '1px solid #1e293b', paddingTop: 8 }}>
                      <span style={{ color: '#94a3b8' }}>{task.assignedToName?.split(' ')[0] || 'Unassigned'}</span>
                      <span style={{ color: '#ec4899', fontWeight: 600 }}>Drag to Sprint &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sprints Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <form onSubmit={createSprint} style={{ background: '#111726', border: '1px solid #1e293b', borderRadius: 14, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="New Sprint Name..."
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                style={{ flex: 1, background: '#090D16', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#090D16', border: '1px solid #1e293b', borderRadius: 8, padding: '4px 10px' }}>
                <input
                  type="number"
                  value={newSprintDays}
                  onChange={(e) => setNewSprintDays(e.target.value)}
                  style={{ width: 38, background: 'transparent', border: 'none', color: '#ec4899', fontWeight: 700, fontSize: 12, outline: 'none' }}
                  min="1"
                />
                <span style={{ fontSize: 11, color: '#64748b' }}>days</span>
              </div>
              <Btn style={{ background: 'linear-gradient(135deg, #db2777, #ec4899)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                <i className="ti ti-plus"></i> Add Sprint
              </Btn>
            </form>

            {sprints.map((s) => {
              const sprintTasks = tasks.filter((t) => t.sprintId === s.id);
              const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);

              return (
                <div key={s.id} style={{ background: '#111726', border: '1px solid #1e293b', borderRadius: 14, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{s.name}</span>
                        <span style={{ fontSize: 10, background: '#1e293b', color: '#94a3b8', padding: '2px 8px', borderRadius: 20 }}>
                          {s.durationDays} Days
                        </span>
                        {s.status === 'ACTIVE' && (
                          <span style={{ fontSize: 10, background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{s.goal}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>{totalPoints} SP</span>
                      <button
                        onClick={() => startSprint(s.id)}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                          color: '#04101e',
                          fontWeight: 700,
                          fontSize: 11,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Start Sprint
                      </button>
                    </div>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropToSprint(e, s.id)}
                    style={{
                      minHeight: 100,
                      background: '#090D16',
                      border: '1px dashed #1e293b',
                      borderRadius: 10,
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    {!sprintTasks.length ? (
                      <div style={{ textAlign: 'center', color: '#475569', fontSize: 11, padding: 20 }}>
                        Drop backlog user stories here
                      </div>
                    ) : (
                      sprintTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          style={{
                            background: '#141c2e',
                            border: '1px solid #243048',
                            borderRadius: 8,
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'grab'
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{task.title}</span>
                          <span style={{ fontSize: 10, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {task.storyPoints} SP
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: ACTIVE KANBAN BOARD ===================== */}
      {activeTab === 'active-sprint' && (
        <div>
          <div style={{ background: '#111726', border: '1px solid #1e293b', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{activeSprint?.name || 'Sprint Board'}</h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Duration: {activeSprint?.durationDays} Days</span>
            </div>
            <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700 }}>
              Total Points: {activeSprintTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} SP
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {Object.entries(KANBAN_LANES).map(([columnId, lane]) => {
              const laneTasks = activeSprintTasks.filter((t) => (t.status || 'INCOMPLETE') === columnId);

              return (
                <div key={columnId} style={{ background: '#111726', border: '1px solid #1e293b', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', minHeight: 600 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: 8, borderBottom: '1px solid #1e293b' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: lane.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {lane.title}
                    </span>
                    <span style={{ fontSize: 11, background: lane.bg, color: lane.color, padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                      {laneTasks.length}
                    </span>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropToLane(e, columnId)}
                    style={{
                      flex: 1,
                      background: '#090D16',
                      border: '1px dashed #1e293b',
                      borderRadius: 10,
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    {laneTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        style={{
                          background: '#141c2e',
                          border: '1px solid #243048',
                          borderRadius: 10,
                          padding: 12,
                          cursor: 'grab'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Badge status={task.priority} />
                          <span style={{ fontSize: 10, color: '#38bdf8', fontWeight: 700 }}>{task.storyPoints} SP</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 4 }}>{task.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{task.description?.substring(0, 60)}</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: 8, fontSize: 11 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar name={task.assignedToName} size={20} />
                            <span style={{ color: '#cbd5e1' }}>{task.assignedToName?.split(' ')[0]}</span>
                          </div>
                          <Stars rating={task.rating} onRate={isAdmin && task.status === 'COMPLETED' ? (s) => rateTask(task.id, s) : null} size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Task to Product Backlog">
        <Field label="Task Title">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter task summary" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Assign To">
            <Select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
              <option value="">Select member...</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Story Points">
            <Input type="number" value={form.storyPoints} onChange={(e) => setForm({ ...form, storyPoints: e.target.value })} min="1" max="40" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </Field>
          <Field label="Due Date">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="User story acceptance criteria..."
            style={{ width: '100%', padding: '9px 13px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 70 }}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Btn variant="outline" onClick={() => setModal(false)}>
            Cancel
          </Btn>
          <Btn onClick={assignTask} style={{ background: '#38bdf8', color: '#090D16', fontWeight: 700 }}>
            <i className="ti ti-check"></i> Add to Backlog
          </Btn>
        </div>
      </Modal>

      <Toast message={toast.msg} visible={toast.show} />
    </div>
  );
}