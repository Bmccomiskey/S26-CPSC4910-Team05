import { useNavigate } from 'react-router-dom';
import DriverOrders from './DriverOrders';
import DriverPoints from './DriverPoints';
import DriverProfile from './DriverProfile';
import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import './DriverDashboard.css';

// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';


export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth('user');
  const [activeTab, setActiveTab] = useState("dashboard");
  const [myApplications, setMyApplications] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
  if (user && activeTab === "apply") {
    fetch(`/applications/sponsors`)
      .then(res => res.json())
      .then(data => setSponsors(data))
      .catch(err => console.error("Error fetching sponsors:", err));
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user) {
      fetch(`/applications/driver/${user.id}`)
        .then(res => res.json())
        .then(data => setMyApplications(data))
        .catch(err => console.error("Error fetching applications:", err));

      fetch(`/points/driver/${user.id}/history`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setTransactions(data))
        .catch(err => console.error("Error fetching points:", err));
    }
  }, [user]);
  const handleApply = async (sponsorId) => {
    try {
      const res = await fetch(`/applications/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          driver_id: user.id,
          sponsor_id: sponsorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || "Something went wrong.");
        setSuccessMessage('');
        return;
      }
      setSuccessMessage("Application submitted successfully!");
      setErrorMessage('');

      // Refresh applications so UI updates
      const refresh = await fetch(
        `/applications/driver/${user.id}`
      );
      const refreshedData = await refresh.json();
      setMyApplications(refreshedData);

    } catch (err) {
      setErrorMessage("Network error.");
      setSuccessMessage('');
    }
  };


  const handleLogout = async () => {
    try {
      await fetch(`/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  useEffect(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, [activeTab]);

  if (loading) return <div style={{ padding: '40px', fontSize: '18px' }}>Loading...</div>;
  if (!user) return null;
  console.log(myApplications);
  return (
    <div className="dd-container">
      <div className="dd-sidebar">
        <div className="dd-sidebar-header">
          <h2 className="dd-sidebar-title">Driver Portal</h2>
        </div>
        <nav className="dd-nav">
          <button
            className={`dd-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
          Dashboard
          </button>

          <button
            className={`dd-nav-item ${activeTab === "apply" ? "active" : ""}`}
            onClick={() => setActiveTab("apply")}
          >
          Apply for Sponsorship
          </button>

          <button
            className={`dd-nav-item ${activeTab === "points" ? "active" : ""}`}
            onClick={() => setActiveTab("points")}
          >My Points</button>
          <button className="dd-nav-item">Catalog</button>
          <button
            className={`dd-nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >My Orders</button>
          <button
            className={`dd-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >Profile</button>
        </nav>
        <button className="dd-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <main className="dd-main">

        {activeTab === "dashboard" && (
          <>
          <div className="dd-top-bar">
          <h1 className="dd-page-title">Driver Dashboard</h1>
        </div>

        <div className="dd-stats-grid">
          ... your existing stat cards ...
        </div>

        <div className="dd-section">
          ... your existing recent activity ...
        </div>
        </>
      )}

      {activeTab === "apply" && (
        <>
        <div className="dd-top-bar">
          <h1 className="dd-page-title">Apply for Sponsorship</h1>
        </div>

        <div className="dd-section">
          {successMessage && (
            <p style={{ marginBottom: "15px", color: "green" }}>
              {successMessage}
              </p>
            )}
            {errorMessage && (
              <p style={{ marginBottom: "15px", color: "red" }}>
                {errorMessage}
                </p>
              )}
          <div className="dd-table-wrapper">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Sponsor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((sponsor, i) => (
                  <tr key={sponsor.id}>
                    <td>{sponsor.email}</td>
                    <td>
                    {(() => {
                      const existing = myApplications.find(
                        app => app.sponsor_id === sponsor.id && app.status === "pending"
                      );

                      if (existing) {
                        return <span>Pending</span>;
                      } 
                      return(
                        <button onClick={() => handleApply(sponsor.id)}>
                          Apply
                        </button>
                      );
                      
                    })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "40px" }}>
              <h2>My Sponsorship Status</h2>
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                      {myApplications.map((app) => (
                        <tr key={app.id}>
                          <td>{app.sponsor_email}</td>
                          <td>
                            {app.status === "APPROVED" && (
                              <span style={{ color: "green", fontWeight: "bold" }}>
                                APPROVED
                                </span>
                            )}
                            {app.status === "PENDING" && (
                              <span style={{ color: "orange" }}>
                                PENDING
                                </span>
                            )}
                            {app.status === "REJECTED" && (
                              <span style={{ color: "red" }}>
                                REJECTED
                                </span>
                            )}
                            </td>
                            </tr>
                          ))}
                          </tbody>
                          </table>
                          </div>

            {sponsors.length === 0 && (
              <p style={{ marginTop: "20px" }}>
                No sponsors available.
              </p>
            )}
          </div>
        </div>
          </>
        )}

      {activeTab === "orders" && (
        <DriverOrders user={user} orders={[]} />
      )}

      {activeTab === "points" && (
        <DriverPoints user={user} transactions={transactions} />
      )}

      {activeTab === "profile" && (
        <DriverProfile user={user} applications={myApplications} transactions={transactions} />
      )}

      </main>
    </div>
  );
}