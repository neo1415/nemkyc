
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Menu, User, LogOut, FileText, Building2, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/NEMs-Logo.jpg';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {isAdmin() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src={logoImage} 
              alt="NEM Insurance" 
              className="w-8 h-8 object-contain rounded"
            />
            <span className="text-xl font-bold text-gray-900">NEM Forms</span>
          </Link>
        </div>

        {/* Navigation for logged in users */}
        {user && !isAdmin() && (
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/kyc" className="flex items-center space-x-1 text-gray-700 hover:text-red-900">
              <FileText className="h-4 w-4" />
              <span>KYC</span>
            </Link>
            <Link to="/cdd" className="flex items-center space-x-1 text-gray-700 hover:text-red-900">
              <Building2 className="h-4 w-4" />
              <span>CDD</span>
            </Link>
            <Link to="/claims" className="flex items-center space-x-1 text-gray-700 hover:text-red-900">
              <Car className="h-4 w-4" />
              <span>Claims</span>
            </Link>
          </nav>
        )}

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to={isAdmin() ? "/admin/profile" : "/dashboard"}>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <Link to="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
