import { useEffect, useState } from "react";
import "./UserManagement.css";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const [creatingUser, setCreatingUser] = useState(false);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserActionMsg("");

    if (!createForm.email.trim() || !createForm.password) {
      setUserActionMsg("Email and password are required.");
      return;
    }

    try {
      setCreatingUser(true);

      const res = await fetch("/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create user");
      }

      setUserActionMsg(data.message || "User created successfully");
      setCreateForm({ email: "", password: "", role: "user" });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      console.error("Create user error:", err);
      setUserActionMsg(err.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    setUserActionMsg("");

    const confirmed = window.confirm(
      `Delete user "${targetUser.email}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/admin/users/${targetUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to delete user");
      }

      setUserActionMsg(data.message || "User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      setUserActionMsg(err.message || "Failed to delete user");
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
        <p style={{ marginTop: "10px", color: "#374151" }}>
          Add, lock, unlock, or remove users from the system.
        </p>

        <div className="um-toolbar">
          <button
            className="um-btn refresh"
            onClick={fetchUsers}
          >
            Refresh Users
          </button>

          <button
            className="um-btn create"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Cancel" : "Add User"}
          </button>
        </div>

        {showCreateForm && (
          <form className="um-create-form" onSubmit={handleCreateUser}>
            <div className="um-form-grid">
              <div className="um-field">
                <label>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="um-field">
                <label>Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="um-field">
                <label>Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  <option value="user">Driver</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="um-create-actions">
              <button
                type="submit"
                className="um-btn create"
                disabled={creatingUser}
              >
                {creatingUser ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        )}

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
                        ) : (
                          <>
                            {u.is_active ? (
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

                            <button
                              className="um-btn delete"
                              onClick={() => handleDeleteUser(u)}
                            >
                              Delete
                            </button>
                          </>
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