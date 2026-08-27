import { describe, expect, it } from 'vitest';
import {
  CLAIM_NAV_ITEMS,
  canAccessClaimCollection,
  filterAccessibleClaimNavItems,
  getAssignedClaimCollectionsForEmail,
  resolveAssignedClaimCollections
} from '../config/claimAccessPolicy';
import { User } from '../types';

describe('claimAccessPolicy', () => {
  it('defines 26 claim navigation items', () => {
    expect(CLAIM_NAV_ITEMS).toHaveLength(26);
  });

  it('maps motor unit admin email to motor claims only', () => {
    const collections = getAssignedClaimCollectionsForEmail('folahanoluwadaisi@nem-insurance.com');
    expect(collections).toEqual(['motor-claims']);
  });

  it('gives full claim access to platform admins', () => {
    expect(resolveAssignedClaimCollections({
      email: 'folahanoluwadaisi@nem-insurance.com',
      role: 'admin'
    })).toBeNull();
  });

  it('scopes unit admin emails while keeping generic claims role unrestricted', () => {
    expect(resolveAssignedClaimCollections({
      email: 'folahanoluwadaisi@nem-insurance.com',
      role: 'claims'
    })).toEqual(['motor-claims']);

    expect(resolveAssignedClaimCollections({
      email: 'random.claims@nem-insurance.com',
      role: 'claims'
    })).toBeNull();
  });

  it('filters sidebar items for scoped unit admins', () => {
    const user: User = {
      uid: '1',
      email: 'folahanoluwadaisi@nem-insurance.com',
      name: 'Motor Admin',
      role: 'claims',
      notificationPreference: 'email',
      assignedClaimCollections: ['motor-claims']
    };

    const items = filterAccessibleClaimNavItems(user);
    expect(items).toHaveLength(1);
    expect(items[0].collection).toBe('motor-claims');
  });

  it('blocks access to collections outside the assigned scope', () => {
    const user: User = {
      uid: '1',
      email: 'folahanoluwadaisi@nem-insurance.com',
      name: 'Motor Admin',
      role: 'claims',
      notificationPreference: 'email',
      assignedClaimCollections: ['motor-claims']
    };

    expect(canAccessClaimCollection(user, 'motor-claims')).toBe(true);
    expect(canAccessClaimCollection(user, 'burglary-claims')).toBe(false);
    expect(canAccessClaimCollection(user, 'contractors-plant-machinery-claims')).toBe(false);
  });

  it('normalizes contractors admin route alias to firestore collection', () => {
    const user: User = {
      uid: '1',
      email: 'nathanielaina@nem-insurance.com',
      name: 'Gen Accident Admin',
      role: 'claims',
      notificationPreference: 'email',
      assignedClaimCollections: resolveAssignedClaimCollections({
        email: 'nathanielaina@nem-insurance.com',
        role: 'claims'
      })
    };

    expect(canAccessClaimCollection(user, 'contractors-plant-machinery-claims')).toBe(true);
  });
});
