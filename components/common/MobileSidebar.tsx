import React from 'react';
import { View } from '../../App';

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setCurrentView: (view: View) => void;
  currentView: View;
}

const NavItem: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactElement;
}> = ({ label, isActive, onClick, icon }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-2 cursor-pointer transition-colors duration-200 rounded-lg ${
      isActive
        ? 'bg-brand-gold text-brand-dark'
        : 'text-gray-300 hover:bg-brand-light-gray hover:text-white'
    }`}
  >
    {icon}
    <span className="mx-4 font-medium">{label}</span>
  </li>
);

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, setIsOpen, currentView, setCurrentView }) => {
  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-brand-gray border-r-2 border-brand-gold z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-center h-20 border-b-2 border-brand-gold">
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider">KA</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4">
            <ul>
               <NavItem
                label="Dashboard"
                isActive={currentView === 'dashboard'}
                onClick={() => handleNavClick('dashboard')}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                  </svg>
                }
              />
              <NavItem
                label="Create CN"
                isActive={currentView === 'create'}
                onClick={() => handleNavClick('create')}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                }
              />
              <NavItem
                label="Party Management"
                isActive={currentView === 'parties'}
                onClick={() => handleNavClick('parties')}
                icon={
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12a5.995 5.995 0 00-3-5.197M15 21a2 2 0 002-2v-1a2 2 0 00-2-2h-1a2 2 0 00-2 2v1a2 2 0 002 2h1zm-6 0a2 2 0 002-2v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 002 2h1z"></path></svg>
                }
              />
               <NavItem
                label="Upload Party Data"
                isActive={currentView === 'uploadParties'}
                onClick={() => handleNavClick('uploadParties')}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                }
              />
              <NavItem
                label="Templates"
                isActive={currentView === 'templates'}
                onClick={() => handleNavClick('templates')}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                }
              />
               <NavItem
                label="Reports"
                isActive={currentView === 'reports'}
                onClick={() => handleNavClick('reports')}
                icon={
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                }
              />
              <NavItem
                label="Audit Log"
                isActive={currentView === 'audit'}
                onClick={() => handleNavClick('audit')}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                }
              />
               <NavItem
                label="Settings"
                isActive={currentView === 'settings'}
                onClick={() => handleNavClick('settings')}
                icon={
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                }
              />
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};