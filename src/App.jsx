import { useState } from 'react';
import Dashboard from './components/Dashboard';
import MedicationList from './components/MedicationList';
import PillScanner from './components/PillScanner';
import Analytics from './components/Analytics';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMedication, setSelectedMedication] = useState(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'medications', label: 'Medications', icon: '💊' },
    { id: 'scanner', label: 'Pill Scanner', icon: '📸' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'medications':
        return <MedicationList onSelectMedication={setSelectedMedication} />;
      case 'scanner':
        return <PillScanner />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app" style={{ minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-md">
              <div style={{ fontSize: '2.5rem' }}>🏥</div>
              <div>
                <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem' }}>
                  Medicine Tracker
                </h1>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                  AI-Powered Medication Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <div className="badge badge-success">
                <span style={{ fontSize: '0.6rem', marginRight: '0.25rem' }}>●</span>
                ML Active
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div className="flex gap-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  transition: 'all var(--transition-base)',
                }}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <div style={{
          animation: 'fadeIn 0.3s ease'
        }}>
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '3rem', textAlign: 'center' }}>
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
          <p>
            Powered by Machine Learning • TensorFlow + scikit-learn
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            ⚠️ This app is for tracking purposes only. Always consult your healthcare provider.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
