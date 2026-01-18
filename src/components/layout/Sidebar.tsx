
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  Users,
  FileText,
  Shield,
  BarChart3,
  X,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Building2,
  Car,
  Fingerprint
} from 'lucide-react';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useAuth } from '../../contexts/AuthContext';
import { hasAnyRole } from '../../utils/roleNormalization';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [kycOpen, setKycOpen] = React.useState(false);
  const [cddOpen, setCddOpen] = React.useState(false);
  const [claimsOpen, setClaimsOpen] = React.useState(false);

  // Check if user has access to Identity Collection
  const hasIdentityAccess = user && hasAnyRole(user.role, ['broker', 'admin', 'compliance', 'super admin']);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    }
  ];

  const kycItems = [
    { name: 'Individual KYC', href: '/admin/kyc/individual' },
    { name: 'Corporate KYC', href: '/admin/kyc/corporate' }
  ];

  const cddItems = [
    { name: 'Corporate CDD', href: '/admin/cdd/corporate' },
    { name: 'NAICOM Corporate CDD', href: '/admin/cdd/naicom-corporate' },
    { name: 'Partners CDD', href: '/admin/cdd/partners' },
    { name: 'NAICOM Partners CDD', href: '/admin/cdd/naicom-partners' },
    { name: 'Individual CDD', href: '/admin/cdd/individual' },
    { name: 'Agents CDD', href: '/admin/cdd/agents' },
    { name: 'Brokers CDD', href: '/admin/cdd/brokers' }
  ];

  const claimsItems = [
    { name: 'Motor Claims', href: '/admin/claims/motor' },
    { name: 'Professional Indemnity', href: '/admin/claims/professional-indemnity' },
    { name: 'Public Liability', href: '/admin/claims/public-liability' },
    { name: 'Employers Liability', href: '/admin/claims/employers-liability' },
    { name: 'Combined GPA & Employers', href: '/admin/claims/combined-gpa-employers' },
    { name: 'Burglary Claims', href: '/admin/claims/burglary' },
    { name: 'Group Personal Accident', href: '/admin/claims/group-personal-accident' },
    { name: 'Fire Special Perils', href: '/admin/claims/fire-special-perils' },
    { name: 'Rent Assurance', href: '/admin/claims/rent-assurance' },
    { name: 'Money Insurance', href: '/admin/claims/money-insurance' },
    { name: 'Goods in Transit', href: '/admin/claims/goods-in-transit' },
    { name: 'Contractors Plant Machinery', href: '/admin/claims/contractors-plant-machinery' },
    { name: 'All Risk Claims', href: '/admin/claims/all-risk' },
    { name: 'Fidelity Guarantee', href: '/admin/claims/fidelity-guarantee' }
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.href
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}

          <Collapsible open={kycOpen} onOpenChange={setKycOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-5 w-5" />
                <span>KYC</span>
              </div>
              {kycOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 mt-2 space-y-1">
              {kycItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'block px-3 py-2 text-sm rounded-lg transition-colors',
                    location.pathname === item.href
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={cddOpen} onOpenChange={setCddOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5" />
                <span>CDD</span>
              </div>
              {cddOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 mt-2 space-y-1">
              {cddItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'block px-3 py-2 text-sm rounded-lg transition-colors',
                    location.pathname === item.href
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={claimsOpen} onOpenChange={setClaimsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <div className="flex items-center space-x-3">
                <Car className="h-5 w-5" />
                <span>Claims</span>
              </div>
              {claimsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 mt-2 space-y-1">
              {claimsItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'block px-3 py-2 text-sm rounded-lg transition-colors',
                    location.pathname === item.href
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Identity Collection - Only for broker, admin, compliance, super_admin */}
          {hasIdentityAccess && (
            <Link
              to="/admin/identity"
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith('/admin/identity')
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Fingerprint className="h-5 w-5" />
              <span>Identity Collection</span>
            </Link>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
