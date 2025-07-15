import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Menu, 
  X, 
  FileText, 
  Building2, 
  Car, 
  ChevronDown, 
  User, 
  Users,
  UserCheck,
  Briefcase,
  Shield,
  Flame,
  Home,
  DollarSign,
  Truck,
  Wrench,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import nemLogo from '../../Nem-insurance-Logo.jpg';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (user) {
      if (isAdmin()) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const kycForms = [
    { name: 'Individual KYC', path: '/kyc/individual', icon: User },
    { name: 'Corporate KYC', path: '/kyc/corporate', icon: Building2 }
  ];

  const cddForms = [
    { name: 'Corporate CDD', path: '/cdd/corporate', icon: Building2 },
    { name: 'Partners CDD', path: '/cdd/partners', icon: Users },
    { name: 'Individual CDD', path: '/cdd/individual', icon: UserCheck },
    { name: 'Agents CDD', path: '/cdd/agents', icon: Briefcase },
    { name: 'Brokers CDD', path: '/cdd/brokers', icon: FileText }
  ];

  const claimsForms = [
    { name: 'Motor Claim', path: '/claims/motor', icon: Car },
    { name: 'Professional Indemnity', path: '/claims/professional-indemnity', icon: Shield },
    { name: 'Public Liability', path: '/claims/public-liability', icon: Users },
    { name: 'Employers Liability', path: '/claims/employers-liability', icon: Building2 },
    { name: 'Burglary Claim', path: '/claims/burglary', icon: Home },
    { name: 'Fire & Special Perils', path: '/claims/fire-special-perils', icon: Flame },
    { name: 'Money Insurance', path: '/claims/money-insurance', icon: DollarSign },
    { name: 'Goods in Transit', path: '/claims/goods-in-transit', icon: Truck },
    { name: 'Contractors Plant', path: '/claims/contractors-plant-machinery', icon: Wrench }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={nemLogo} 
                alt="NEM Insurance" 
                className="h-10 w-10 object-contain rounded"
              />
              <span className="text-xl font-bold text-primary">NEM Forms</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* KYC Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="group">
                  <Link 
                    to="/kyc" 
                    className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>KYC</span>
                    <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
                  </Link>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white z-50 shadow-lg border">
                {kycForms.map((form) => (
                  <DropdownMenuItem key={form.path} asChild>
                    <Link to={form.path} className="flex items-center space-x-2">
                      <form.icon className="h-4 w-4" />
                      <span>{form.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* CDD Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="group">
                  <Link 
                    to="/cdd" 
                    className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>CDD</span>
                    <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
                  </Link>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white z-50 shadow-lg border">
                {cddForms.map((form) => (
                  <DropdownMenuItem key={form.path} asChild>
                    <Link to={form.path} className="flex items-center space-x-2">
                      <form.icon className="h-4 w-4" />
                      <span>{form.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Claims Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="group">
                  <Link 
                    to="/claims" 
                    className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  >
                    <Car className="h-4 w-4" />
                    <span>Claims</span>
                    <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
                  </Link>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white z-50 shadow-lg border max-h-96 overflow-y-auto">
                {claimsForms.map((form) => (
                  <DropdownMenuItem key={form.path} asChild>
                    <Link to={form.path} className="flex items-center space-x-2">
                      <form.icon className="h-4 w-4" />
                      <span>{form.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-white z-50 shadow-lg border" align="end">
                  <DropdownMenuItem asChild>
                    <button onClick={handleDashboardClick} className="flex items-center space-x-2 w-full">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button onClick={logout} className="flex items-center space-x-2 w-full">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4 space-y-2">
            <div className="space-y-1">
              <Link to="/kyc" className="block px-3 py-2 text-gray-700 hover:text-primary">
                KYC Forms
              </Link>
              <Link to="/cdd" className="block px-3 py-2 text-gray-700 hover:text-primary">
                CDD Forms
              </Link>
              <Link to="/claims" className="block px-3 py-2 text-gray-700 hover:text-primary">
                Claims Forms
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;