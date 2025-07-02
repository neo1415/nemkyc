
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmin() && (
        <>
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} lg:ml-64`}>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <main className="p-6">
              <Outlet />
            </main>
          </div>
        </>
      )}
      
      {!isAdmin() && (
        <div className="min-h-screen">
          <Header onMenuClick={() => {}} />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
};

export default Layout;
