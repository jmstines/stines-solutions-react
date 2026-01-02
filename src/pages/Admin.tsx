import { useAuth } from '../contexts/AuthContext';
import './Admin.css';

export default function Admin() {
  const { user } = useAuth();

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user?.email}!</p>
      </div>
      
      <div className="admin-content">
        <div className="admin-section">
          <h2>Site Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Visits</h3>
              <p className="stat-value">--</p>
              <p className="stat-label">Coming soon</p>
            </div>
            <div className="stat-card">
              <h3>Contact Forms</h3>
              <p className="stat-value">--</p>
              <p className="stat-label">Coming soon</p>
            </div>
            <div className="stat-card">
              <h3>Page Views</h3>
              <p className="stat-value">--</p>
              <p className="stat-label">Coming soon</p>
            </div>
          </div>
        </div>

        <div className="admin-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-button">View Contact Submissions</button>
            <button className="action-button">Manage Projects</button>
            <button className="action-button">Site Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
