import { useState } from 'react';
import './UserManagement.css';

export default function SystemManagement() {
  const [teamNum, setTeamNum] = useState('');
  const [verNum, setVerNum] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/admin/version/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANT (matches your auth system)
        body: JSON.stringify({
          teamNum: parseInt(teamNum),
          verNum: parseInt(verNum),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Version updated successfully!');
        setTeamNum('');
        setVerNum('');
      } else {
        setMessage(data.detail || 'Update failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error.');
    }
  };

  return (
    <div className="sd-section">
      <h2>Update Version Info</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Team Number:</label><br />
          <input
            type="number"
            value={teamNum}
            onChange={(e) => setTeamNum(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Version Number:</label><br />
          <input
            type="number"
            value={verNum}
            onChange={(e) => setVerNum(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="sd-nav-item" style={{ width: 'auto' }}>
          Update Version
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '10px', color: '#c9c9c9' }}>{message}</p>
      )}
    </div>
  );
}