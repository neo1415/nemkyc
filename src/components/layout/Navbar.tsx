import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import logoImage from '/NEMLogo (2)_page-0001.jpg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertCircle } from 'lucide-react';
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
// Logo is now served from public folder

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNaicomModal, setShowNaicomModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
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

  const handleCDDFormClick = (formId: string, originalPath: string) => {
    if (formId === 'corporate' || formId === 'partners') {
      setSelectedForm(formId);
      setShowNaicomModal(true);
    } else {
      navigate(originalPath);
    }
  };

  const handleNaicomChoice = (isNaicom: boolean) => {
    if (selectedForm === 'corporate') {
      navigate(isNaicom ? '/cdd/naicom-corporate' : '/cdd/corporate');
    } else if (selectedForm === 'partners') {
      navigate(isNaicom ? '/cdd/naicom-partners' : '/cdd/partners');
    }
    setShowNaicomModal(false);
    setSelectedForm(null);
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
    <nav className="bg-background shadow-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src={logoImage} 
                  alt="NEM Insurance" 
                  className="h-10 w-10 object-contain rounded"
                />
                <span className="text-xl font-bold text-primary">NEM Forms</span>
              </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="space-x-2">
                {/* KYC Navigation */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="group">
                    <Link 
                      to="/kyc" 
                      className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-4 w-4" />
                      <span>KYC</span>
                    </Link>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-64 p-3 bg-background">
                      <div className="grid gap-1">
                        {kycForms.map((form) => (
                          <NavigationMenuLink key={form.path} asChild>
                            <Link 
                              to={form.path} 
                              className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 transition-colors"
                            >
                              <form.icon className="h-4 w-4" />
                              <span>{form.name}</span>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* CDD Navigation */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="group">
                    <Link 
                      to="/cdd" 
                      className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>CDD</span>
                    </Link>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-64 p-3 bg-background">
                      <div className="grid gap-1">
                        {cddForms.map((form) => (
                          <NavigationMenuLink key={form.path} asChild>
                            {form.name === 'Corporate CDD' || form.name === 'Partners CDD' ? (
                              <button
                                onClick={() => handleCDDFormClick(
                                  form.name === 'Corporate CDD' ? 'corporate' : 'partners', 
                                  form.path
                                )}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 transition-colors w-full text-left"
                              >
                                <form.icon className="h-4 w-4" />
                                <span>{form.name}</span>
                              </button>
                            ) : (
                              <Link 
                                to={form.path} 
                                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 transition-colors"
                              >
                                <form.icon className="h-4 w-4" />
                                <span>{form.name}</span>
                              </Link>
                            )}
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Claims Navigation */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="group">
                    <Link 
                      to="/claims" 
                      className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Car className="h-4 w-4" />
                      <span>Claims</span>
                    </Link>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-64 p-3 bg-background max-h-96 overflow-y-auto">
                      <div className="grid gap-1">
                        {claimsForms.map((form) => (
                          <NavigationMenuLink key={form.path} asChild>
                            <Link 
                              to={form.path} 
                              className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 transition-colors"
                            >
                              <form.icon className="h-4 w-4" />
                              <span>{form.name}</span>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:block text-sm text-gray-600">
                Welcome, {user.name || user.email}
              </div>
            )}
            {user ? (
              <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="sm" className="flex items-center space-x-1 cursor-pointer">
                     <User className="h-4 w-4" />
                     <ChevronDown className="h-4 w-4" />
                   </Button>
                 </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-background z-50 shadow-lg border" align="end">
                   <DropdownMenuItem asChild>
                     <button onClick={handleDashboardClick} className="flex items-center space-x-2 w-full cursor-pointer">
                       <LayoutDashboard className="h-4 w-4" />
                       <span>Dashboard</span>
                     </button>
                   </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                     <button onClick={logout} className="flex items-center space-x-2 w-full cursor-pointer">
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

      {/* NAICOM Modal */}
      <Dialog open={showNaicomModal} onOpenChange={setShowNaicomModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">NAICOM Approval Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">
                Are you NAICOM approved for this type of business?
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleNaicomChoice(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Yes, I am NAICOM approved
              </Button>
              <Button 
                onClick={() => handleNaicomChoice(false)}
                variant="outline" 
                className="w-full"
              >
                No, I am not NAICOM approved
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>This information determines which form variant you need to complete.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;