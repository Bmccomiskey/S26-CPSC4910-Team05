import { useEffect, useState } from "react";
import "./UserManagement.css";
import BulkUpload from './BulkUpload';

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
  const [editingUser, setEditingUser] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

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

  const handleAssumeUser = async (u) => {
    setUserActionMsg("");

    if (u.role === "admin") {
      setUserActionMsg("Cannot impersonate an admin account.");
      return;
    }

    //saves the real admin identity in localStorage once
    if (!localStorage.getItem("impersonatorRole")) {
      localStorage.setItem("impersonatorRole", localStorage.getItem("userRole") || "");
      localStorage.setItem("impersonatorEmail", localStorage.getItem("userEmail") || "");
      localStorage.setItem("impersonatorId", localStorage.getItem("userId") || "");
    }

    try {
      const res = await fetch(`/admin/impersonate/start/${u.id}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to impersonate");

      //switch the “identity” to the target
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("isImpersonating", "true");

      //navigate to the correct dashboard
      if (data.user.role === "sponsor") window.location.href = "/sponsor-dashboard";
      else window.location.href = "/driver-dashboard";
    } catch (err) {
      setUserActionMsg(err.message || "Failed to impersonate");
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

  const openProfileEditor = async (u) => {
    setUserActionMsg("");
    setProfileLoading(true);

    try {
      const res = await fetch(`/admin/users/${u.id}/profile`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load profile");
      }

      setEditingUser(data.user);
      setProfileForm(data.profile || {});
    } catch (err) {
      console.error("Load profile error:", err);
      setUserActionMsg(err.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileEditor = () => {
    setEditingUser(null);
    setProfileForm({});
  };

  const updateProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!editingUser) return;

    setUserActionMsg("");
    setSavingProfile(true);

    try {
      const res = await fetch(`/admin/users/${editingUser.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to save profile");
      }

      setUserActionMsg(data.message || "Profile updated successfully");
      setEditingUser(data.user);
      setProfileForm(data.profile || {});
      fetchUsers();
    } catch (err) {
      console.error("Save profile error:", err);
      setUserActionMsg(err.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
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
          Add, lock, unlock, remove users, or update profile information.
        </p>

        <div className="sd-section">
          <h2>Bulk Upload Users</h2>

          <BulkUpload currentUser={currentUser} />
        </div>

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

        {profileLoading && <p className="um-loading">Loading profile...</p>}

        {editingUser && (
          <form className="um-profile-form" onSubmit={handleSaveProfile}>
            <div className="um-profile-header">
              <div>
                <h3>
                  Edit {editingUser.role === "user" ? "Driver" : "Sponsor"} Profile
                </h3>
                <p>
                  Updating profile for <strong>{editingUser.email}</strong>
                </p>
              </div>

              <button
                type="button"
                className="um-btn delete"
                onClick={closeProfileEditor}
              >
                Close
              </button>
            </div>

            <div className="um-form-grid">
              <div className="um-field">
                <label>Phone</label>
                <input
                  value={profileForm.phone || ""}
                  onChange={(e) => updateProfileField("phone", e.target.value)}
                />
              </div>

              {editingUser.role === "user" ? (
                <>
                  <div className="um-field">
                    <label>First Name</label>
                    <input
                      value={profileForm.first_name || ""}
                      onChange={(e) => updateProfileField("first_name", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Last Name</label>
                    <input
                      value={profileForm.last_name || ""}
                      onChange={(e) => updateProfileField("last_name", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>City</label>
                    <input
                      value={profileForm.city || ""}
                      onChange={(e) => updateProfileField("city", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>State</label>
                    <input
                      value={profileForm.state || ""}
                      onChange={(e) => updateProfileField("state", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>CDL Number</label>
                    <input
                      value={profileForm.cdl_number || ""}
                      onChange={(e) => updateProfileField("cdl_number", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>CDL Class</label>
                    <select
                      value={profileForm.cdl_class || ""}
                      onChange={(e) => updateProfileField("cdl_class", e.target.value)}
                    >
                      <option value="">Select class</option>
                      <option value="Class A">Class A</option>
                      <option value="Class B">Class B</option>
                      <option value="Class C">Class C</option>
                    </select>
                  </div>

                  <div className="um-field">
                    <label>Years of Experience</label>
                    <input
                      value={profileForm.years_exp || ""}
                      onChange={(e) => updateProfileField("years_exp", e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="um-field">
                    <label>Company Name</label>
                    <input
                      value={profileForm.company_name || ""}
                      onChange={(e) => updateProfileField("company_name", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Contact Name</label>
                    <input
                      value={profileForm.contact_name || ""}
                      onChange={(e) => updateProfileField("contact_name", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Website</label>
                    <input
                      value={profileForm.website || ""}
                      onChange={(e) => updateProfileField("website", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Address</label>
                    <input
                      value={profileForm.address || ""}
                      onChange={(e) => updateProfileField("address", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Industry</label>
                    <input
                      value={profileForm.industry || ""}
                      onChange={(e) => updateProfileField("industry", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Point Budget</label>
                    <input
                      value={profileForm.point_budget || ""}
                      onChange={(e) => updateProfileField("point_budget", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Min Point Cost</label>
                    <input
                      value={profileForm.min_point_cost || ""}
                      onChange={(e) => updateProfileField("min_point_cost", e.target.value)}
                    />
                  </div>

                  <div className="um-field">
                    <label>Max Point Cost</label>
                    <input
                      value={profileForm.max_point_cost || ""}
                      onChange={(e) => updateProfileField("max_point_cost", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="um-create-actions">
              <button
                type="button"
                className="um-btn delete"
                onClick={closeProfileEditor}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="um-btn create"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}

        {userActionMsg && <p className="um-message">{userActionMsg}</p>}

        {usersLoading ? (
          <p className="um-loading">Loading users...</p>
        ) : (
          <div className="um-table-wrap">
            <table className="um-table">
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

                            {(u.role === "user" || u.role === "sponsor") && (
                              <button
                                className="um-btn create"
                                onClick={() => openProfileEditor(u)}
                              >
                                Edit Profile
                              </button>
                            )}

                            <button
                              className="um-btn delete"
                              onClick={() => handleDeleteUser(u)}
                            >
                              Delete
                            </button>

                            <button
                              className="um-btn assume"
                              onClick={() => handleAssumeUser(u)}
                            >
                              Assume
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