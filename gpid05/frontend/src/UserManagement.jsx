import { useEffect, useState } from "react";
import "./UserManagement.css";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState("");

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUserActionMsg("");

    try {
      const res = await fetch("/admin/users", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load users");
      }

      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setUserActionMsg(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleLockUser = async (userId) => {
    setUserActionMsg("");

    try {
      const res = await fetch(`/admin/users/${userId}/lock`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to lock user");
      }

      setUserActionMsg(data.message || "User locked successfully");
      fetchUsers();
    } catch (err) {
      console.error("Lock user error:", err);
      setUserActionMsg(err.message || "Failed to lock user");
    }
  };

  const handleUnlockUser = async (userId) => {
    setUserActionMsg("");

    try {
      const res = await fetch(`/admin/users/${userId}/unlock`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to unlock user");
      }

      setUserActionMsg(data.message || "User unlocked successfully");
      fetchUsers();
    } catch (err) {
      console.error("Unlock user error:", err);
      setUserActionMsg(err.message || "Failed to unlock user");
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  return (
    <>
    <div className="sd-top-bar">
      <h1 className="sd-page-title">User Management</h1>
    </div>

    <div className="sd-section">
      <h2>Manage User Accounts</h2>
      <p style={{ marginTop: "10px", color: "#c9c9c9" }}>
        Lock or unlock user accounts.
      </p>

      <div className="um-toolbar">
        <button className="um-btn refresh" onClick={fetchUsers}>
          Refresh Users
        </button>
      </div>

      {userActionMsg && <p className="um-message">{userActionMsg}</p>}

      {usersLoading ? (
        <p className="um-loading">Loading users...</p>
      ) : (
        <div className="um-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>

                  <td>
                    <span className={`um-role ${u.role}`}>{u.role}</span>
                  </td>

                  <td>
                    <span className={`um-status ${u.is_active ? "active" : "locked"}`}>
                      {u.is_active ? "Active" : "Locked"}
                    </span>
                  </td>

                  <td>
                    <div className="um-actions">
                      {u.id === currentUser?.id ? (
                        <span className="um-current-admin">Current Admin</span>
                      ) : u.is_active ? (
                        <button
                          className="um-btn lock"
                          onClick={() => handleLockUser(u.id)}
                        >
                          Lock
                        </button>
                      ) : (
                        <button
                          className="um-btn unlock"
                          onClick={() => handleUnlockUser(u.id)}
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!usersLoading && users.length === 0 && (
            <p className="um-empty">No users found.</p>
          )}
        </div>
      )}
    </div>
  </>
);
}