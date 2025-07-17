
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import Navbar from './Navbar';
import LoadingSpinner from '../common/LoadingSpinner';
import { Menu } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Check if current route is dashboard-related
  const isDashboardRoute = location.pathname.startsWith('/admin') || location.pathname === '/dashboard';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin dashboard view */}
      {isAdmin() && isDashboardRoute && (
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
      
      {/* Regular authenticated view (including admins on non-dashboard pages) */}
      {(!isAdmin() || !isDashboardRoute) && (
        <div className="min-h-screen">
          <Navbar />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
};

export default Layout;
