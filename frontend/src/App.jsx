import React, { useState } from 'react';
import Navbar from './components/Navbar';
import WorkflowBuilder from './pages/WorkflowBuilder';
import Telemetry from './pages/Telemetry';

function App() {
  const [activeTab, setActiveTab] = useState('builder');
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [saveNotification, setSaveNotification] = useState(false);

  const handleSave = () => {
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 3000);
  };

  const handleExport = () => {
    setJsonModalOpen(true);
  };

  return (
    <div className="nexusflow-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#090d16' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={handleSave}
        onExport={handleExport}
      />

      <main style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'builder' ? (
          <WorkflowBuilder
            jsonModalOpen={jsonModalOpen}
            setJsonModalOpen={setJsonModalOpen}
            saveNotification={saveNotification}
            setSaveNotification={setSaveNotification}
          />
        ) : (
          <Telemetry />
        )}
      </main>
    </div>
  );
}

export default App;
