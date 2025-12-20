import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import MedicationList from './components/MedicationList';
import PillScanner from './components/PillScanner';
import Analytics from './components/Analytics';
import './index.css';

// Google Client ID for OAuth
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "104169543162-p7g6u9k865j59b56f8f1766579669668.apps.googleusercontent.com";

function AppContent() {
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMedication, setSelectedMedication] = useState(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'medications', label: 'Medications', icon: '💊' },
    { id: 'scanner', label: 'Pill Scanner', icon: '📸' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🏥</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Medicine Tracker</h2>
          <p className="text-secondary mb-lg">
            Professional medication management powered by AI. Sign in to your account.
          </p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={credentialResponse => {
                login(credentialResponse.credential);
              }}
              onError={() => {
                console.log('Login Failed');
                alert('Authentication failed. Please try again.');
              }}
              useOneTap
            />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'medications': return <MedicationList onSelectMedication={setSelectedMedication} />;
      case 'scanner': return <PillScanner />;
      case 'analytics': return <Analytics />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="header-nav">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-md">
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            <div>
              <h3 style={{ margin: 0 }}>Medicine Tracker</h3>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Enterprise Health Solutions</p>
            </div>
          </div>

          <div className="flex items-center gap-md">
            <div className="badge badge-success">ML ACTIVE</div>
            <div className="flex items-center gap-sm">
              <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{user.name}</span>
              <button className="btn btn-outline" onClick={logout} style={{ padding: '0.4rem 0.8rem' }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="container flex-grow" style={{ padding: 'var(--spacing-xl) 0' }}>
        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Dynamic Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', padding: 'var(--spacing-xl) 0' }}>
        <div className="container text-center text-muted" style={{ fontSize: '0.875rem' }}>
          <p>© 2025 Medicine Tracker Enterprise • Professional Grade ML</p>
          <p style={{ marginTop: '0.5rem' }}>Securely logged in as: {user.email}</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
