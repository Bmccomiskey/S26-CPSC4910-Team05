import { useState, useEffect } from 'react';
import './SponsorGoals.css';

export default function SponsorGoals({ user, approvedDrivers = [] }) {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [driverId, setDriverId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetPoints, setTargetPoints] = useState('');
  const [deadline, setDeadline] = useState('');

  const flash = (msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(''); }
    else { setSuccessMsg(msg); setErrorMsg(''); }
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 3500);
  };

  const fetchGoals = () => {
    fetch(`/points/goals/sponsor/${user.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setGoals(data))
      .catch(err => console.error('Error fetching goals:', err));
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const handleSubmit = async () => {
    if (!driverId) return flash('Please select a driver.', true);
    if (!title.trim()) return flash('Please enter a goal title.', true);
    if (!targetPoints || Number(targetPoints) <= 0) return flash('Please enter a valid target.', true);

    setSubmitting(true);
    try {
      const res = await fetch('/points/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sponsor_id: user.id,
          driver_id: Number(driverId),
          title,
          description,
          target_points: Number(targetPoints),
          deadline: deadline || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        flash(d.detail || 'Something went wrong.', true);
      } else {
        flash('Goal created successfully!');
        setShowForm(false);
        setDriverId(''); setTitle(''); setDescription('');
        setTargetPoints(''); setDeadline('');
        fetchGoals();
      }
    } catch {
      flash('Network error.', true);
    }
    setSubmitting(false);
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Delete this goal?')) return;
    await fetch(`/points/goals/${goalId}?sponsor_id=${user.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchGoals();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="sg-root">
      <div className="sg-page-header">
        <div>
          <h1 className="sg-page-title">Driver Goals</h1>
          <p className="sg-page-sub">Set point targets for your approved drivers</p>
        </div>
        <button className="sg-create-btn" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {successMsg && <div className="sg-alert sg-alert-success">✓ {successMsg}</div>}
      {errorMsg   && <div className="sg-alert sg-alert-error">⚠ {errorMsg}</div>}

      {/* Create goal form */}
      {showForm && (
        <div className="sg-card sg-card-form">
          <div className="sg-card-header">
            <h2 className="sg-card-title">Create New Goal</h2>
            <span className="sg-card-icon">🎯</span>
          </div>
          <div className="sg-form">
            <div className="sg-field sg-field-full">
              <label className="sg-label">Select Driver</label>
              {approvedDrivers.length === 0 ? (
                <p className="sg-empty-text">No approved drivers. Approve drivers from Manage Drivers first.</p>
              ) : (
                <select className="sg-input" value={driverId} onChange={e => setDriverId(e.target.value)}>
                  <option value="">— Choose a driver —</option>
                  {approvedDrivers.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>{d.driver_email}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="sg-field sg-field-full">
              <label className="sg-label">Goal Title</label>
              <input className="sg-input" type="text" placeholder="e.g. March Safety Bonus" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="sg-field">
              <label className="sg-label">Target Points</label>
              <input className="sg-input" type="number" min="1" placeholder="e.g. 500" value={targetPoints} onChange={e => setTargetPoints(e.target.value)} />
            </div>

            <div className="sg-field">
              <label className="sg-label">Deadline <span className="sg-optional">(optional)</span></label>
              <input className="sg-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div className="sg-field sg-field-full">
              <label className="sg-label">Description <span className="sg-optional">(optional)</span></label>
              <input className="sg-input" type="text" placeholder="e.g. Earn points for safe driving habits this month" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="sg-form-actions">
              <button className="sg-submit-btn" onClick={handleSubmit} disabled={submitting || approvedDrivers.length === 0}>
                {submitting ? 'Creating…' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="sg-card">
          <div className="sg-empty">
            <p className="sg-empty-title">No goals yet</p>
            <p className="sg-empty-desc">Create a goal to give your drivers a points target to aim for.</p>
          </div>
        </div>
      ) : (
        <div className="sg-goals-grid">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.current_points / goal.target_points) * 100));
            const days = daysLeft(goal.deadline);
            const overdue = days !== null && days < 0;
            const urgent = days !== null && days >= 0 && days <= 3;

            return (
              <div key={goal.id} className={`sg-goal-card ${goal.completed ? 'sg-goal-completed' : ''}`}>
                <div className="sg-goal-header">
                  <div>
                    <p className="sg-goal-driver">{goal.driver_email}</p>
                    <h3 className="sg-goal-title">{goal.title}</h3>
                  </div>
                  <div className="sg-goal-header-right">
                    {goal.completed && <span className="sg-badge-complete">✓ Complete</span>}
                    {!goal.completed && overdue && <span className="sg-badge-overdue">Overdue</span>}
                    {!goal.completed && urgent && <span className="sg-badge-urgent">{days}d left</span>}
                    <button className="sg-delete-btn" onClick={() => handleDelete(goal.id)}>✕</button>
                  </div>
                </div>

                {goal.description && <p className="sg-goal-desc">{goal.description}</p>}

                <div className="sg-progress-wrap">
                  <div className="sg-progress-bar">
                    <div
                      className={`sg-progress-fill ${goal.completed ? 'sg-progress-done' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="sg-progress-labels">
                    <span className="sg-progress-current">{goal.current_points.toLocaleString()} pts earned</span>
                    <span className="sg-progress-pct">{pct}% of {goal.target_points.toLocaleString()}</span>
                  </div>
                </div>

                <div className="sg-goal-footer">
                  <span className="sg-goal-meta">
                    {goal.deadline ? `Deadline: ${formatDate(goal.deadline)}` : 'No deadline'}
                  </span>
                  <span className="sg-goal-meta">Created {formatDate(goal.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
