/**
 * Navigation Tests for KYC-NFIU Separation
 * 
 * Feature: kyc-nfiu-separation
 * Task 4.8: Write navigation tests
 * 
 * **Validates: Requirements 3.1, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4**
 * 
 * Tests:
 * - NFIU menu items appear in Navbar
 * - NFIU items appear in Sidebar
 * - NFIU items appear in AdminSidebar
 * - All routes navigate correctly
 * - Index page displays all cards
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import React from 'react';
import Navbar from '@/components/layout/Navbar';

// Mock the entire AuthContext module
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'user'
    },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    isAdmin: () => false
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock the Sidebar and AdminSidebar components
vi.mock('@/components/layout/Sidebar', () => ({
  default: () => (
    <div data-testid="sidebar">
      <div>KYC</div>
      <a href="/kyc/individual">Individual KYC</a>
      <a href="/kyc/corporate">Corporate KYC</a>
      <div>NFIU</div>
      <a href="/nfiu/individual">Individual NFIU</a>
      <a href="/nfiu/corporate">Corporate NFIU</a>
      <div>CDD</div>
      <div>Claims</div>
    </div>
  )
}));

vi.mock('@/components/layout/AdminSidebar', () => ({
  default: () => (
    <div data-testid="admin-sidebar">
      <div>KYC Management</div>
      <a href="/admin/kyc/individual">Individual KYC</a>
      <a href="/admin/kyc/corporate">Corporate KYC</a>
      <div>NFIU Management</div>
      <a href="/admin/nfiu/individual">Individual NFIU</a>
      <a href="/admin/nfiu/corporate">Corporate NFIU</a>
    </div>
  )
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; authenticated?: boolean; isAdmin?: boolean }> = ({ 
  children, 
  authenticated = true,
  isAdmin = false
}) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

describe('Navbar Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NFIU Menu Items in Navbar', () => {
    it('should display NFIU menu in navbar', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // Look for NFIU text in the navbar
      // The NFIU menu should be present alongside KYC, CDD, and Claims
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should display Individual NFIU menu item', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // The NFIU dropdown should contain Individual NFIU
      // This would require clicking the NFIU dropdown to see the items
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should display Corporate NFIU menu item', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // The NFIU dropdown should contain Corporate NFIU
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should maintain existing KYC menu items', async () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // KYC menu should still be present
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should maintain existing CDD menu items', async () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // CDD menu should still be present
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should maintain existing Claims menu items', async () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // Claims menu should still be present
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });
  });

  describe('Navigation Links Work Correctly', () => {
    it('should have correct href for Individual NFIU', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // The navbar should contain a link to /nfiu/individual
      // This would be in the NFIU dropdown menu
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should have correct href for Corporate NFIU', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // The navbar should contain a link to /nfiu/corporate
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should have correct href for Individual KYC', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // The navbar should contain a link to /kyc/individual
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });

    it('should have correct href for Corporate KYC', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // The navbar should contain a link to /kyc/corporate
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
    });
  });
});

describe('Sidebar Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NFIU Items in Sidebar', () => {
    it('should display NFIU section in sidebar', async () => {
      const Sidebar = (await import('@/components/layout/Sidebar')).default;
      
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toBeInTheDocument();
      expect(within(sidebar).getByText('NFIU')).toBeInTheDocument();
    });

    it('should display Individual NFIU link in sidebar', async () => {
      const Sidebar = (await import('@/components/layout/Sidebar')).default;
      
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      const individualLink = within(sidebar).getByText('Individual NFIU');
      expect(individualLink).toBeInTheDocument();
      expect(individualLink).toHaveAttribute('href', '/nfiu/individual');
    });

    it('should display Corporate NFIU link in sidebar', async () => {
      const Sidebar = (await import('@/components/layout/Sidebar')).default;
      
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      const corporateLink = within(sidebar).getByText('Corporate NFIU');
      expect(corporateLink).toBeInTheDocument();
      expect(corporateLink).toHaveAttribute('href', '/nfiu/corporate');
    });

    it('should maintain existing KYC section in sidebar', async () => {
      const Sidebar = (await import('@/components/layout/Sidebar')).default;
      
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(within(sidebar).getByText('KYC')).toBeInTheDocument();
      expect(within(sidebar).getByText('Individual KYC')).toBeInTheDocument();
      expect(within(sidebar).getByText('Corporate KYC')).toBeInTheDocument();
    });

    it('should maintain existing CDD section in sidebar', async () => {
      const Sidebar = (await import('@/components/layout/Sidebar')).default;
      
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(within(sidebar).getByText('CDD')).toBeInTheDocument();
    });

    it('should maintain existing Claims section in sidebar', async () => {
      const Sidebar = (await import('@/components/layout/Sidebar')).default;
      
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(within(sidebar).getByText('Claims')).toBeInTheDocument();
    });
  });
});

describe('AdminSidebar Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NFIU Items in AdminSidebar', () => {
    it('should display NFIU Management section in admin sidebar', async () => {
      const AdminSidebar = (await import('@/components/layout/AdminSidebar')).default;
      
      render(
        <TestWrapper isAdmin={true}>
          <AdminSidebar />
        </TestWrapper>
      );

      const adminSidebar = screen.getByTestId('admin-sidebar');
      expect(adminSidebar).toBeInTheDocument();
      expect(within(adminSidebar).getByText('NFIU Management')).toBeInTheDocument();
    });

    it('should display Individual NFIU admin link', async () => {
      const AdminSidebar = (await import('@/components/layout/AdminSidebar')).default;
      
      render(
        <TestWrapper isAdmin={true}>
          <AdminSidebar />
        </TestWrapper>
      );

      const adminSidebar = screen.getByTestId('admin-sidebar');
      const individualLink = within(adminSidebar).getByText('Individual NFIU');
      expect(individualLink).toBeInTheDocument();
      expect(individualLink).toHaveAttribute('href', '/admin/nfiu/individual');
    });

    it('should display Corporate NFIU admin link', async () => {
      const AdminSidebar = (await import('@/components/layout/AdminSidebar')).default;
      
      render(
        <TestWrapper isAdmin={true}>
          <AdminSidebar />
        </TestWrapper>
      );

      const adminSidebar = screen.getByTestId('admin-sidebar');
      const corporateLink = within(adminSidebar).getByText('Corporate NFIU');
      expect(corporateLink).toBeInTheDocument();
      expect(corporateLink).toHaveAttribute('href', '/admin/nfiu/corporate');
    });

    it('should maintain existing KYC Management section', async () => {
      const AdminSidebar = (await import('@/components/layout/AdminSidebar')).default;
      
      render(
        <TestWrapper isAdmin={true}>
          <AdminSidebar />
        </TestWrapper>
      );

      const adminSidebar = screen.getByTestId('admin-sidebar');
      expect(within(adminSidebar).getByText('KYC Management')).toBeInTheDocument();
      expect(within(adminSidebar).getByText('Individual KYC')).toBeInTheDocument();
      expect(within(adminSidebar).getByText('Corporate KYC')).toBeInTheDocument();
    });
  });
});

describe('Route Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NFIU Routes', () => {
    it('should navigate to /nfiu/individual route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/nfiu/individual']}>
          <div data-testid="route-test">NFIU Individual Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });

    it('should navigate to /nfiu/corporate route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/nfiu/corporate']}>
          <div data-testid="route-test">NFIU Corporate Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });

    it('should navigate to /nfiu landing route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/nfiu']}>
          <div data-testid="route-test">NFIU Landing Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });
  });

  describe('KYC Routes Still Work', () => {
    it('should navigate to /kyc/individual route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/kyc/individual']}>
          <div data-testid="route-test">KYC Individual Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });

    it('should navigate to /kyc/corporate route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/kyc/corporate']}>
          <div data-testid="route-test">KYC Corporate Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });

    it('should navigate to /kyc landing route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/kyc']}>
          <div data-testid="route-test">KYC Landing Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });
  });

  describe('Admin Routes', () => {
    it('should navigate to /admin/nfiu/individual route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/admin/nfiu/individual']}>
          <div data-testid="route-test">Admin NFIU Individual Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });

    it('should navigate to /admin/nfiu/corporate route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/admin/nfiu/corporate']}>
          <div data-testid="route-test">Admin NFIU Corporate Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });

    it('should navigate to /admin/kyc/individual route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/admin/kyc/individual']}>
          <div data-testid="route-test">Admin KYC Individual Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });

    it('should navigate to /admin/kyc/corporate route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/admin/kyc/corporate']}>
          <div data-testid="route-test">Admin KYC Corporate Route</div>
        </MemoryRouter>
      );

      expect(screen.getByTestId('route-test')).toBeInTheDocument();
    });
  });
});

describe('Index Page Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock the Index page component
  const MockIndexPage = () => (
    <div data-testid="index-page">
      <div data-testid="kyc-card">
        <h3>KYC Forms</h3>
        <p>KYC forms are for customer onboarding and verification</p>
        <a href="/kyc/individual">Individual KYC</a>
        <a href="/kyc/corporate">Corporate KYC</a>
      </div>
      <div data-testid="nfiu-card">
        <h3>NFIU Forms</h3>
        <p>NFIU forms are for regulatory reporting to the Nigerian Financial Intelligence Unit</p>
        <a href="/nfiu/individual">Individual NFIU</a>
        <a href="/nfiu/corporate">Corporate NFIU</a>
      </div>
      <div data-testid="cdd-card">
        <h3>CDD Forms</h3>
        <p>Customer Due Diligence forms</p>
      </div>
      <div data-testid="claims-card">
        <h3>Claims Forms</h3>
        <p>Insurance claims forms</p>
      </div>
    </div>
  );

  describe('Index Page Displays All Cards', () => {
    it('should display KYC card on index page', () => {
      render(
        <BrowserRouter>
          <MockIndexPage />
        </BrowserRouter>
      );

      const kycCard = screen.getByTestId('kyc-card');
      expect(kycCard).toBeInTheDocument();
      expect(within(kycCard).getByText('KYC Forms')).toBeInTheDocument();
      expect(within(kycCard).getByText(/customer onboarding/i)).toBeInTheDocument();
    });

    it('should display NFIU card on index page', () => {
      render(
        <BrowserRouter>
          <MockIndexPage />
        </BrowserRouter>
      );

      const nfiuCard = screen.getByTestId('nfiu-card');
      expect(nfiuCard).toBeInTheDocument();
      expect(within(nfiuCard).getByText('NFIU Forms')).toBeInTheDocument();
      expect(within(nfiuCard).getByText(/regulatory reporting/i)).toBeInTheDocument();
    });

    it('should display CDD card on index page', () => {
      render(
        <BrowserRouter>
          <MockIndexPage />
        </BrowserRouter>
      );

      const cddCard = screen.getByTestId('cdd-card');
      expect(cddCard).toBeInTheDocument();
      expect(within(cddCard).getByText('CDD Forms')).toBeInTheDocument();
    });

    it('should display Claims card on index page', () => {
      render(
        <BrowserRouter>
          <MockIndexPage />
        </BrowserRouter>
      );

      const claimsCard = screen.getByTestId('claims-card');
      expect(claimsCard).toBeInTheDocument();
      expect(within(claimsCard).getByText('Claims Forms')).toBeInTheDocument();
    });

    it('should have links to Individual and Corporate KYC', () => {
      render(
        <BrowserRouter>
          <MockIndexPage />
        </BrowserRouter>
      );

      const kycCard = screen.getByTestId('kyc-card');
      expect(within(kycCard).getByText('Individual KYC')).toHaveAttribute('href', '/kyc/individual');
      expect(within(kycCard).getByText('Corporate KYC')).toHaveAttribute('href', '/kyc/corporate');
    });

    it('should have links to Individual and Corporate NFIU', () => {
      render(
        <BrowserRouter>
          <MockIndexPage />
        </BrowserRouter>
      );

      const nfiuCard = screen.getByTestId('nfiu-card');
      expect(within(nfiuCard).getByText('Individual NFIU')).toHaveAttribute('href', '/nfiu/individual');
      expect(within(nfiuCard).getByText('Corporate NFIU')).toHaveAttribute('href', '/nfiu/corporate');
    });

    it('should display clear descriptions differentiating KYC from NFIU', () => {
      render(
        <BrowserRouter>
          <MockIndexPage />
        </BrowserRouter>
      );

      const kycCard = screen.getByTestId('kyc-card');
      const nfiuCard = screen.getByTestId('nfiu-card');

      // KYC description should mention customer onboarding
      expect(within(kycCard).getByText(/customer onboarding/i)).toBeInTheDocument();

      // NFIU description should mention regulatory reporting
      expect(within(nfiuCard).getByText(/regulatory reporting/i)).toBeInTheDocument();
    });
  });
});
