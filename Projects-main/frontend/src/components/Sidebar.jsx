import React from 'react';
import { NavLink } from 'react-router-dom';

// Helper Icon Component
const Icon = ({ path }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 min-w-[24px]">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// Helper Link Component
const SidebarLink = ({ text, path, to, isOpen }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-3 py-3 rounded-md transition-all duration-300 group
      ${isActive ? 'bg-blue-900/40 text-white border-l-4 border-blue-500' : 'text-gray-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}
      `
    }
  >
    {/* Icon stays fixed width so it never moves */}
    <Icon path={path} />

    {/* Text Wrapper: Handles the smooth reveal/hide */}
    <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap
        ${isOpen ? 'w-40 ml-3 opacity-100' : 'w-0 ml-0 opacity-0'}`}
    >
        {text}
    </div>
    
    {/* Hover Tooltip (Only visible when sidebar is closed) */}
    {!isOpen && (
        <div className="absolute left-16 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg whitespace-nowrap">
            {text}
        </div>
    )}
  </NavLink>
);

function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <aside 
        className={`h-screen bg-slate-900 shadow-2xl flex flex-col fixed top-0 left-0 z-40 border-r border-slate-700 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}`}
    >
      
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700 relative">
        {/* Logo Text with smooth fade */}
        <h1 className={`font-bold text-white text-xl absolute transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            PdM System
        </h1>
        
        {/* Small Logo for collapsed state */}
        <h1 className={`font-bold text-blue-500 text-xl absolute transition-all duration-300 ${isOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
            PM
        </h1>
      </div>

      {/* Toggle Button (Absolute position on the border) */}
      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-20 bg-blue-600 text-white p-1 rounded-full shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-110 z-50 border border-slate-900"
      >
        {isOpen ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
             </svg>
        ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
             </svg>
        )}
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
        <SidebarLink 
          to="/" 
          text="Dashboard" 
          isOpen={isOpen}
          path="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" 
        />
        <SidebarLink 
          to="/machines" 
          text="Machines Fleet" 
          isOpen={isOpen}
          path="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" 
        />
        <SidebarLink 
          to="/alerts" 
          text="System Alerts" 
          isOpen={isOpen}
          path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" 
        />
        <SidebarLink 
          to="/reports" 
          text="Analytics Reports" 
          isOpen={isOpen}
          path="M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 19.875v-6.75ZM3 7.125C3 6.504 3.504 6 4.125 6h15.75c.621 0 1.125.504 1.125 1.125v.001c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 7.125v-.001Z" 
        />
      </nav>

      {/* User Profile (Footer) */}
      <div className="p-4 border-t border-slate-700">
        <div className={`flex items-center ${isOpen ? 'justify-start space-x-3' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm min-w-[2rem]">
                AD
            </div>
            <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isOpen ? 'w-32 opacity-100' : 'w-0 opacity-0'}`}>
                <p className="text-sm text-white font-medium">Admin User</p>
                <p className="text-xs text-gray-400">admin@factory.com</p>
            </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;