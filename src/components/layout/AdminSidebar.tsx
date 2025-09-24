import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  FileText,
  UserCheck,
  Building2,
  Car,
  ChevronDown,
  X,
  User,
  Home,
  Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [kycOpen, setKycOpen] = useState(false);
  const [cddOpen, setCddOpen] = useState(false);
  const [claimsOpen, setClaimsOpen] = useState(false);

  // Role-based access control
  const canViewUsers = user?.role === 'super admin';
  const canViewClaims = ['claims', 'admin', 'super admin'].includes(user?.role || '');
  const canViewKYCCDD = ['compliance', 'admin', 'super admin'].includes(user?.role || '');

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3
    },
    ...(canViewUsers ? [{
      name: 'Users',
      href: '/admin/users', 
      icon: Users
    }, {
      name: 'Events Log',
      href: '/admin/events-log',
      icon: Users
    }] : []),
    {
      name: 'Profile',
      href: '/admin/profile',
      icon: User
    }
  ];

  const kycItems = [
    { name: 'Individual KYC', href: '/admin/kyc/individual' },
    { name: 'Corporate KYC', href: '/admin/kyc/corporate' }
  ];

  const cddItems = [
    { name: 'Individual CDD', href: '/admin/cdd/individual' },
    { name: 'Corporate CDD', href: '/admin/cdd/corporate' },
    { name: 'Partners CDD', href: '/admin/cdd/partners' },
    { name: 'Agents CDD', href: '/admin/cdd/agents' },
    { name: 'Brokers CDD', href: '/admin/cdd/brokers' }
  ];

  const claimsItems = [
    { name: 'Motor Claims', href: '/admin/motor-claims' },
    { name: 'Fire & Special Perils', href: '/admin/fire-special-perils-claims' },
    { name: 'Employers Liability', href: '/admin/employers-liability-claims' },
    { name: 'All Risk Claims', href: '/admin/all-risk-claims' },
    { name: 'Professional Indemnity', href: '/admin/professional-indemnity-claims' },
    { name: 'Public Liability', href: '/admin/public-liability-claims' },
    { name: 'Combined GPA Employers Liability', href: '/admin/combined-gpa-employers-liability-claims' },
    { name: 'Group Personal Accident', href: '/admin/group-personal-accident-claims' },
    { name: 'Goods In Transit', href: '/admin/goods-in-transit-claims' },
    { name: 'Rent Assurance', href: '/admin/rent-assurance-claims' },
    { name: 'Money Insurance', href: '/admin/money-insurance-claims' },
    { name: 'Burglary Claims', href: '/admin/burglary-claims' },
    { name: 'Contractors Plant Machinery', href: '/admin/contractors-plant-machinery-claims' },
    { name: 'Fidelity Guarantee', href: '/admin/fidelity-guarantee-claims' }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1 overflow-y-auto h-full pb-20">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/admin'}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-red-100 text-red-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}

          {/* KYC Section - Only for compliance, admin, and super admin */}
          {canViewKYCCDD && (
            <Collapsible open={kycOpen} onOpenChange={setKycOpen}>
              <CollapsibleTrigger className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                <UserCheck className="mr-3 h-5 w-5" />
                KYC Forms
                <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", kycOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1">
                {kycItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center pl-11 pr-2 py-2 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-red-100 text-red-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* CDD Section - Only for compliance, admin, and super admin */}
          {canViewKYCCDD && (
            <Collapsible open={cddOpen} onOpenChange={setCddOpen}>
              <CollapsibleTrigger className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                <Building2 className="mr-3 h-5 w-5" />
                CDD Forms
                <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", cddOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1">
                {cddItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center pl-11 pr-2 py-2 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-red-100 text-red-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Claims Section - Only for claims, admin, and super admin */}
          {canViewClaims && (
            <Collapsible open={claimsOpen} onOpenChange={setClaimsOpen}>
              <CollapsibleTrigger className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                <Car className="mr-3 h-5 w-5" />
                Claims Forms
                <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", claimsOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1">
                {claimsItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center pl-11 pr-2 py-2 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-red-100 text-red-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;