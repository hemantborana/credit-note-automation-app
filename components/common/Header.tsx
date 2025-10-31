import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-brand-gray border-b-2 border-brand-gold shadow-lg flex items-center">
      <div className="md:hidden pl-4">
        <button onClick={onMenuClick} className="text-white focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-widest uppercase">
          CN Management System
        </h1>
      </div>
    </header>
  );
};