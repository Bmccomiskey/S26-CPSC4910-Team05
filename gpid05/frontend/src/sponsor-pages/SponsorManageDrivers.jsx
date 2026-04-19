import { useEffect, useState } from "react";
import { useAuth } from '../useAuth';

export default function SponsorManageDrivers() {
  const { user, loading } = useAuth("sponsor");
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    try {
      const res = await fetch(
        `/applications/sponsor/${user.id}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error("Failed to fetch applications");

      const data = await res.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [user]);

  const handleApprove = async (applicationId) => {
    await fetch(
      `/applications/${applicationId}/approve?sponsor_id=${user.id}`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    fetchApplications();
  };

  const handleReject = async (applicationId) => {
    await fetch(
      `/applications/${applicationId}/reject?sponsor_id=${user.id}`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    fetchApplications();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Driver Applications</h2>

      

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Driver ID</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>{app.id}</td>
              <td>{app.driver_id}</td>
              <td>{app.status}</td>
              <td>
                {app.status === "PENDING" && (
                  <>
                    <button onClick={() => handleApprove(app.id)}>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      style={{ marginLeft: "10px" }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}