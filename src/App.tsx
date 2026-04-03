import { useState, useEffect } from 'react';
import { useLeasingStore } from './store/useLeasingStore';
import Dashboard from './components/Dashboard';
import ContractSettings from './components/ContractSettings';
import MileageList from './components/MileageList';
import PerformanceChart from './components/PerformanceChart';

type Tab = 'dashboard' | 'chart' | 'mileage' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Übersicht', icon: '📊' },
  { id: 'chart', label: 'Verlauf', icon: '📈' },
  { id: 'mileage', label: 'Kilometer', icon: '🚗' },
  { id: 'settings', label: 'Einstellungen', icon: '⚙️' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('lp_theme') as 'dark' | 'light') ?? 'dark';
  });

  const { contract, entries, saveContract, addEntry, updateEntry, deleteEntry, stats } =
    useLeasingStore();

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lp_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">🚘</span>
          <span className="brand-name">Leasing Performance</span>
        </div>
        <nav className="tab-nav" role="navigation" aria-label="Hauptnavigation">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
        <button
          id="theme-toggle"
          className="btn btn-ghost theme-toggle"
          onClick={toggleTheme}
          aria-label="Theme wechseln"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <>
            <Dashboard contract={contract} entries={entries} stats={stats} />
          </>
        )}
        {activeTab === 'chart' && (
          <PerformanceChart contract={contract} entries={entries} />
        )}
        {activeTab === 'mileage' && (
          <MileageList
            entries={entries}
            onAdd={addEntry}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />
        )}
        {activeTab === 'settings' && (
          <ContractSettings contract={contract} onSave={saveContract} />
        )}
      </main>
    </div>
  );
}

export default App;
