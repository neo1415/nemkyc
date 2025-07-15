
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import LoadingSpinner from '../common/LoadingSpinner';
import { Menu } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmin() && (
        <div className="flex h-screen">
          <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
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
