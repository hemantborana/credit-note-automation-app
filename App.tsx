import React, { useState } from 'react';
import CreateCN from './components/CreateCN';
import Dashboard from './components/Dashboard';
import PartyManagement from './components/PartyManagement';
import Settings from './components/Settings';
import Reports from './components/Reports';
import TemplateManagement from './components/TemplateManagement';
import AuditLog from './components/AuditLog';
import UploadPartyData from './components/UploadPartyData';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastProvider } from './components/common/Toast';
import { MobileSidebar } from './components/common/MobileSidebar';

export type View = 'create' | 'dashboard' | 'parties' | 'reports' | 'settings' | 'templates' | 'audit' | 'uploadParties';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'create':
        return <CreateCN />;
      case 'dashboard':
        return <Dashboard />;
      case 'parties':
        return <PartyManagement />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'templates':
        return <TemplateManagement />;
      case 'audit':
        return <AuditLog />;
      case 'uploadParties':
        return <UploadPartyData />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-brand-gray">
        <Sidebar setCurrentView={setCurrentView} currentView={currentView} />
        <MobileSidebar 
          isOpen={isMobileSidebarOpen} 
          setIsOpen={setMobileSidebarOpen}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-dark p-4 sm:p-6 lg:p-8">
            {renderView()}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;