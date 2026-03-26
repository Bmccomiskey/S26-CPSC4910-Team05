import { useEffect, useState } from 'react';

export default function SystemManagement() {
  const [teamNum, setTeamNum] = useState('');
  const [verNum, setVerNum] = useState('');
  const [versions, setVersions] = useState([]);
  const [message, setMessage] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);
  const [editVerNum, setEditVerNum] = useState('');

  const fetchVersions = async () => {
    try {
      const res = await fetch('/admin/version', {
        credentials: 'include',
      });
      const data = await res.json();
      setVersions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/admin/version/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teamNum: parseInt(teamNum),
          verNum: parseInt(verNum),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Saved successfully!');
        setTeamNum('');
        setVerNum('');
        fetchVersions();
      } else {
        setMessage(data.detail);
      }
    } catch {
      setMessage('Server error.');
    }
  };

  const handleDelete = async (teamNum) => {
    if (!window.confirm('Delete this entry?')) return;

    try {
      const res = await fetch(`/admin/version/${teamNum}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        fetchVersions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (row) => {
    setEditingTeam(row.teamNum);
    setEditVerNum(row.verNum);
  };

  const submitEdit = async (teamNum) => {
    try {
      const res = await fetch('/admin/version/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teamNum,
          verNum: parseInt(editVerNum),
        }),
      });

      if (res.ok) {
        setEditingTeam(null);
        fetchVersions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="sd-section">
      <h2>Version Management</h2>

      {/* CREATE / UPDATE FORM */}
      <form onSubmit={handleCreateOrUpdate} style={{ marginTop: '15px' }}>
        <input
          type="number"
          placeholder="Team Number"
          value={teamNum}
          onChange={(e) => setTeamNum(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Version Number"
          value={verNum}
          onChange={(e) => setVerNum(e.target.value)}
          required
          style={{ marginLeft: '10px' }}
        />

        <button type="submit" className="sd-nav-item" style={{ marginLeft: '10px' }}>
          Save
        </button>
      </form>

      {message && <p style={{ marginTop: '10px' }}>{message}</p>}

      {/* TABLE */}
      <div style={{ marginTop: '25px' }}>
        <h3>Existing Versions</h3>

        <table style={{ width: '100%', marginTop: '10px' }}>
          <thead>
            <tr>
              <th>Team</th>
              <th>Version</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {versions.map((row) => (
              <tr key={row.teamNum}>
                <td>{row.teamNum}</td>

                <td>
                  {editingTeam === row.teamNum ? (
                    <input
                      type="number"
                      value={editVerNum}
                      onChange={(e) => setEditVerNum(e.target.value)}
                    />
                  ) : (
                    row.verNum
                  )}
                </td>

                <td>{row.updated}</td>

                <td>
                  {editingTeam === row.teamNum ? (
                    <>
                      <button onClick={() => submitEdit(row.teamNum)}>Save</button>
                      <button onClick={() => setEditingTeam(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(row)}>Edit</button>
                      <button onClick={() => handleDelete(row.teamNum)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}