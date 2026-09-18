import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminSidebar, { resolveSidebarAccess } from '../components/layout/AdminSidebar';
import type { User } from '../types';

const authState = vi.hoisted(() => ({ user: null as Record<string, unknown> | null }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

const asUser = (overrides: Partial<User>): void => {
  authState.user = {
    uid: 'u1',
    email: 'staff@nem-insurance.com',
    name: 'Staff',
    notificationPreference: 'email',
    assignedClaimCollections: null,
    ...overrides,
  };
};

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <AdminSidebar open onClose={() => {}} />
    </MemoryRouter>,
  );

const sectionNames = ['Claims Queue', 'Claims Forms', 'KYC Forms', 'CDD Forms', 'NFIU Forms', 'Identity Collection', 'Users'];
const visibleSections = () => sectionNames.filter((name) => screen.queryByText(name) !== null);

describe('AdminSidebar role scoping', () => {
  beforeEach(() => {
    authState.user = null;
  });

  it('claims role sees only the claims queue and claim collections', () => {
    asUser({ role: 'claims' });
    renderSidebar();

    expect(visibleSections()).toEqual(['Claims Queue', 'Claims Forms']);
    expect(screen.getByText('Claims Queue').closest('a')).toHaveAttribute('href', '/admin/claims-queue');
  });

  it('claims role scoped to a unit only sees that unit’s claim collections', () => {
    asUser({ role: 'claims', assignedClaimCollections: ['motor-claims'] });
    renderSidebar();

    fireEvent.click(screen.getByText('Claims Forms'));
    expect(screen.getByText('Motor Claims')).toBeInTheDocument();
    expect(screen.queryByText('Fire & Special Perils')).not.toBeInTheDocument();
  });

  it('compliance role sees only KYC, CDD and NFIU tables', () => {
    asUser({ role: 'compliance' });
    renderSidebar();

    expect(visibleSections()).toEqual(['KYC Forms', 'CDD Forms', 'NFIU Forms', 'Identity Collection']);
  });

  it('admin sees everything except user management', () => {
    asUser({ role: 'admin' });
    renderSidebar();

    expect(visibleSections()).toEqual(['Claims Queue', 'Claims Forms', 'KYC Forms', 'CDD Forms', 'NFIU Forms', 'Identity Collection']);
  });

  it('super admin sees everything', () => {
    asUser({ role: 'super admin' });
    renderSidebar();

    expect(visibleSections()).toEqual(sectionNames);
  });

  it('normalises role spelling variants', () => {
    expect(resolveSidebarAccess('Super-Admin')).toMatchObject({ role: 'super admin', canViewUsers: true, canViewClaims: true, canViewKYCCDD: true });
    expect(resolveSidebarAccess('claim')).toMatchObject({ role: 'claims', canViewClaims: true, canViewKYCCDD: false, canViewUsers: false });
    expect(resolveSidebarAccess('Compliance')).toMatchObject({ role: 'compliance', canViewClaims: false, canViewKYCCDD: true });
    expect(resolveSidebarAccess(undefined)).toMatchObject({ role: 'default', canViewClaims: false, canViewKYCCDD: false });
  });
});
