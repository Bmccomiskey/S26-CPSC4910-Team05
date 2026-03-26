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

      if (!res.ok || !Array.isArray(data)) {
        setVersions([]);
        return;
      }

      setVersions(data);
    } catch (err) {
      console.error(err);
      setVersions([]);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleCreateOrUpdate = async (e) => {
  e.preventDefault();

  const team = parseInt(teamNum);
  const version = parseInt(verNum);

  if (isNaN(team) || isNaN(version)) {
    setMessage('Please enter valid numbers.');
    return;
  }

  try {
    const res = await fetch('/admin/version/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
       teamnum: Number(teamNum),
       vernum: Number(verNum),
    }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.ok) {
      setMessage('Saved successfully!');
      setTeamNum('');
      setVerNum('');
      fetchVersions();
    } else {

      if (Array.isArray(data)) {
        setMessage(data[0]?.msg || 'Validation error.');
      } else {
        setMessage(data?.detail || 'Update failed.');
      }
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

      if (res.ok) fetchVersions();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (row) => {
    setEditingTeam(row.teamNum);
    setEditVerNum(row.verNum);
  };

const submitEdit = async (teamNum) => {
  const version = parseInt(editVerNum);

  if (isNaN(version)) {
    setMessage('Invalid version number.');
    return;
  }

  try {
    const res = await fetch('/admin/version/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        teamNum,
        verNum: version,
      }),
    });

    if (res.ok) {
      setEditingTeam(null);
      fetchVersions();
    } else {
      setMessage('Update failed.');
    }
  } catch (err) {
    console.error(err);
  }
};

  return (
    <>
      {/* FORM SECTION */}
      <div className="sd-section">
  <h2 className="sd-section-title">Update Version Info</h2>

  <form onSubmit={handleCreateOrUpdate} style={{ marginTop: '10px' }}>
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          color: '#64748b',
          marginBottom: '4px',
        }}
      >
        Team Number
      </label>
      <input
        type="number"
        value={teamNum}
        onChange={(e) => setTeamNum(e.target.value)}
        required
        style={{ padding: '6px', width: '200px' }}
      />
    </div>

    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          color: '#64748b',
          marginBottom: '4px',
        }}
      >
        Version Number
      </label>
      <input
        type="number"
        value={verNum}
        onChange={(e) => setVerNum(e.target.value)}
        required
        style={{ padding: '6px', width: '200px' }}
      />
    </div>

    <button type="submit" className="sd-nav-item">
      Save
    </button>
  </form>

  {message && (
    <p style={{ marginTop: '10px', color: '#64748b' }}>{message}</p>
  )}
</div>

      {/* TABLE SECTION */}
      <div className="sd-section" style={{ marginTop: '20px' }}>
        <h2 className="sd-section-title">Existing Versions</h2>

        <div className="sd-table-wrapper">
          <table className="sd-table">
            <thead>
              <tr>
                <th className="sd-th">Team</th>
                <th className="sd-th">Version</th>
                <th className="sd-th">Updated</th>
                <th className="sd-th">Actions</th>
              </tr>
            </thead>

            <tbody>
              {Array.isArray(versions) &&
                versions.map((row, index) => (
                  <tr
                    key={row.teamNum}
                    className={index % 2 === 0 ? 'sd-tr-even' : ''}
                  >
                    <td className="sd-td">{row.teamNum}</td>

                    <td className="sd-td">
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

                    <td className="sd-td">{row.updated}</td>

                    <td className="sd-td">
                      {editingTeam === row.teamNum ? (
                        <>
                          <button type="button" onClick={() => submitEdit(row.teamNum)}>
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingTeam(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEdit(row)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(row.teamNum)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}