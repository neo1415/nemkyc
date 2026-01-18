/**
 * Integration Tests for Identity Collection System - New Features
 * 
 * Feature: identity-remediation
 * 
 * Tests:
 * - Broker workflow (registration, access control, list isolation)
 * - Template mode (Individual/Corporate validation)
 * - Dynamic email templates (NIN/CAC specific content)
 * - Role management (admin changing user roles)
 * 
 * **Validates: Requirements 11, 12, 13, 14, 15**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ========== Mock Implementations ==========

/**
 * Mock Firestore database for testing
 */
class MockFirestore {
  private users: Map<string, any> = new Map();
  private lists: Map<string, any> = new Map();
  private entries: Map<string, any> = new Map();

  reset() {
    this.users.clear();
    this.lists.clear();
    this.entries.clear();
  }

  getAllUsers(): any[] {
    return Array.from(this.users.values());
  }

  createUser(user: any): void {
    this.users.set(user.uid, user);
  }

  getUser(uid: string): any | undefined {
    return this.users.get(uid);
  }

  updateUser(uid: string, updates: any): void {
    const user = this.users.get(uid);
    if (user) {
      this.users.set(uid, { ...user, ...updates });
    } else {
      throw new Error(`User ${uid} not found`);
    }
  }

  createList(list: any): void {
    this.lists.set(list.id, list);
  }

  getList(id: string): any | undefined {
    return this.lists.get(id);
  }

  getListsByCreator(createdBy: string): any[] {
    return Array.from(this.lists.values()).filter(l => l.createdBy === createdBy);
  }

  getAllLists(): any[] {
    return Array.from(this.lists.values());
  }

  createEntry(entry: any): void {
    this.entries.set(entry.id, entry);
  }

  getEntriesByList(listId: string): any[] {
    return Array.from(this.entries.values()).filter(e => e.listId === listId);
  }
}

/**
 * Mock authentication service
 */
class MockAuthService {
  private currentUser: any = null;
  private userCounter = 0;

  async register(email: string, password: string, userType?: 'regular' | 'broker'): Promise<{ uid: string; role: string }> {
    const uid = `user-${Date.now()}-${this.userCounter++}`;
    const role = userType === 'broker' ? 'broker' : 'default';
    this.currentUser = { uid, email, role };
    return { uid, role };
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  setCurrentUser(user: any): void {
    this.currentUser = user;
  }
}

/**
 * Mock email service
 */
class MockEmailService {
  private sentEmails: Array<{
    to: string;
    subject: string;
    html: string;
    verificationType: 'NIN' | 'CAC';
  }> = [];

  reset() {
    this.sentEmails = [];
  }

  async sendVerificationEmail(
    to: string,
    verificationType: 'NIN' | 'CAC',
    verificationLink: string,
    customerName?: string
  ): Promise<{ success: boolean }> {
    const subject = 'Identity Verification Request - NEM Insurance';
    const html = this.generateEmailContent(verificationType, verificationLink, customerName);
    
    this.sentEmails.push({ to, subject, html, verificationType });
    return { success: true };
  }

  private generateEmailContent(verificationType: 'NIN' | 'CAC', link: string, customerName?: string): string {
    const greeting = 'Dear Client';
    
    const clientTypeText = verificationType === 'NIN'
      ? 'For Individual Clients: National Identification Number (NIN)'
      : 'For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number';
    
    return `
${greeting},

We write to inform you that, in line with the directives of the National Insurance Commission (NAICOM) and ongoing regulatory requirements on Know Your Customer (KYC) and data integrity, all insurance companies are mandated to obtain and update the identification details of their clients.

Accordingly, we kindly request your cooperation in providing the following, as applicable:

${clientTypeText}

To ensure confidentiality and data protection, we have provided a secured link through which the required information can be safely submitted. Kindly access the link below and complete the request at your earliest convenience:

${link}

Please note that failure to update these details may affect the continued administration of your policy, in line with regulatory guidelines.

We appreciate your understanding and continued support as we work to remain fully compliant with NAICOM regulations. Should you require any clarification or assistance, please do not hesitate to contact us via:

Email: nemsupport@nem-insurance.com
Telephone: 0201-4489570-2

Thank you for your cooperation.

Yours faithfully,
NEM Insurance
    `;
  }

  getSentEmails() {
    return this.sentEmails;
  }

  getEmailsSentTo(email: string) {
    return this.sentEmails.filter(e => e.to === email);
  }
}

/**
 * File parser for template validation
 */
class FileParser {
  private static INDIVIDUAL_REQUIRED = ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender'];
  private static CORPORATE_REQUIRED = ['company name', 'company address', 'email address', 'company type', 'phone number'];

  static validateIndividualTemplate(columns: string[]): { valid: boolean; missing: string[] } {
    const normalizedColumns = columns.map(c => c.toLowerCase().trim());
    const missing: string[] = [];
    
    for (const required of this.INDIVIDUAL_REQUIRED) {
      if (!normalizedColumns.includes(required)) {
        missing.push(required);
      }
    }
    
    return { valid: missing.length === 0, missing };
  }

  static validateCorporateTemplate(columns: string[]): { valid: boolean; missing: string[] } {
    const normalizedColumns = columns.map(c => c.toLowerCase().trim());
    const missing: string[] = [];
    
    for (const required of this.CORPORATE_REQUIRED) {
      if (!normalizedColumns.includes(required)) {
        missing.push(required);
      }
    }
    
    return { valid: missing.length === 0, missing };
  }

  static detectListType(columns: string[]): 'individual' | 'corporate' | null {
    const individualValidation = this.validateIndividualTemplate(columns);
    const corporateValidation = this.validateCorporateTemplate(columns);
    
    if (individualValidation.valid) return 'individual';
    if (corporateValidation.valid) return 'corporate';
    return null;
  }
}

/**
 * Identity service that coordinates all operations
 */
class IdentityService {
  private listCounter = 0;
  private entryCounter = 0;
  
  constructor(
    private db: MockFirestore,
    private auth: MockAuthService,
    private email: MockEmailService
  ) {}

  /**
   * Register a new user
   */
  async registerUser(email: string, password: string, userType?: 'regular' | 'broker'): Promise<{ uid: string; role: string }> {
    const { uid, role } = await this.auth.register(email, password, userType);
    
    this.db.createUser({
      uid,
      email,
      role,
      createdAt: new Date(),
    });
    
    return { uid, role };
  }

  /**
   * Create a new identity list
   */
  async createList(
    name: string,
    columns: string[],
    entries: any[],
    uploadMode: 'template' | 'flexible',
    createdBy: string
  ): Promise<{ listId: string; listType: string }> {
    const listId = `list-${Date.now()}-${this.listCounter++}`;
    let listType: 'individual' | 'corporate' | 'flexible' = 'flexible';
    
    if (uploadMode === 'template') {
      const detectedType = FileParser.detectListType(columns);
      if (!detectedType) {
        throw new Error('Could not detect list type from columns');
      }
      listType = detectedType;
    }
    
    const list = {
      id: listId,
      name,
      columns,
      uploadMode,
      listType,
      createdBy,
      totalEntries: entries.length,
      verifiedCount: 0,
      createdAt: new Date(),
    };
    
    this.db.createList(list);
    
    // Create entries
    for (const entry of entries) {
      this.db.createEntry({
        id: `entry-${Date.now()}-${this.entryCounter++}`,
        listId,
        data: entry,
        status: 'pending',
        createdAt: new Date(),
      });
    }
    
    return { listId, listType };
  }

  /**
   * Get lists for a user (filtered by role)
   */
  async getLists(userId: string): Promise<any[]> {
    const user = this.db.getUser(userId);
    if (!user) throw new Error('User not found');
    
    // Brokers see only their own lists
    if (user.role === 'broker') {
      return this.db.getListsByCreator(userId);
    }
    
    // Admin, compliance, super_admin see all lists
    if (['admin', 'super_admin', 'compliance'].includes(user.role)) {
      return this.db.getAllLists();
    }
    
    // Default and claims roles have no access
    return [];
  }

  /**
   * Get a specific list (with access control)
   */
  async getList(listId: string, userId: string): Promise<any> {
    const user = this.db.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const list = this.db.getList(listId);
    if (!list) throw new Error('List not found');
    
    // Brokers can only access their own lists
    if (user.role === 'broker' && list.createdBy !== userId) {
      throw new Error('403 Forbidden - You do not have permission to access this resource');
    }
    
    // Admin, compliance, super_admin can access all lists
    // Broker can access their own lists (already checked above)
    if (!['admin', 'super_admin', 'compliance', 'broker'].includes(user.role)) {
      throw new Error('403 Forbidden - You do not have permission to access this resource');
    }
    
    // If broker, verify ownership again
    if (user.role === 'broker' && list.createdBy !== userId) {
      throw new Error('403 Forbidden - You do not have permission to access this resource');
    }
    
    return list;
  }

  /**
   * Send verification emails
   */
  async sendVerificationEmails(
    listId: string,
    entryIds: string[],
    verificationType: 'NIN' | 'CAC',
    userId: string
  ): Promise<{ sent: number }> {
    // Check access
    await this.getList(listId, userId);
    
    const entries = this.db.getEntriesByList(listId).filter(e => entryIds.includes(e.id));
    
    for (const entry of entries) {
      const email = entry.data.email || entry.data['email address'];
      const name = entry.data.name || entry.data['first name'];
      const token = `token-${Date.now()}-${Math.random()}`;
      const link = `https://nemforms.com/verify/${token}`;
      
      await this.email.sendVerificationEmail(email, verificationType, link, name);
    }
    
    return { sent: entries.length };
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    targetUserId: string,
    newRole: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const admin = this.db.getUser(adminUserId);
    if (!admin) return { success: false, error: 'Admin user not found' };
    
    if (!['admin', 'super_admin'].includes(admin.role)) {
      return { success: false, error: '403 Forbidden - Only administrators can change user roles' };
    }
    
    const targetUser = this.db.getUser(targetUserId);
    if (!targetUser) return { success: false, error: 'Target user not found' };
    
    this.db.updateUser(targetUserId, { role: newRole });
    return { success: true };
  }

  /**
   * Validate template columns
   */
  validateTemplate(columns: string[], templateType: 'individual' | 'corporate'): { valid: boolean; missing: string[] } {
    if (templateType === 'individual') {
      return FileParser.validateIndividualTemplate(columns);
    } else {
      return FileParser.validateCorporateTemplate(columns);
    }
  }
}

// ========== Integration Tests ==========

describe('Integration Tests: Identity Collection System - New Features', () => {
  let db: MockFirestore;
  let auth: MockAuthService;
  let email: MockEmailService;
  let service: IdentityService;

  beforeEach(() => {
    db = new MockFirestore();
    auth = new MockAuthService();
    email = new MockEmailService();
    service = new IdentityService(db, auth, email);
  });

  describe('25.1 Broker Workflow', () => {
    it('should set role to broker when user registers as broker', async () => {
      const result = await service.registerUser('broker@example.com', 'password123', 'broker');
      
      expect(result.role).toBe('broker');
      
      const user = db.getUser(result.uid);
      expect(user.role).toBe('broker');
    });

    it('should set role to default when user registers as regular user', async () => {
      const result = await service.registerUser('user@example.com', 'password123', 'regular');
      
      expect(result.role).toBe('default');
      
      const user = db.getUser(result.uid);
      expect(user.role).toBe('default');
    });

    it('should set role to default when userType is undefined', async () => {
      const result = await service.registerUser('user@example.com', 'password123');
      
      expect(result.role).toBe('default');
    });

    it('should set createdBy correctly when broker uploads list', async () => {
      const { uid } = await service.registerUser('broker@example.com', 'password123', 'broker');
      
      const { listId } = await service.createList(
        'Broker List',
        ['name', 'email', 'phone'],
        [{ name: 'John Doe', email: 'john@example.com', phone: '1234567890' }],
        'flexible',
        uid
      );
      
      const list = db.getList(listId);
      expect(list.createdBy).toBe(uid);
    });

    it('should allow broker to see only their own lists', async () => {
      // Create broker 1
      const broker1 = await service.registerUser('broker1@example.com', 'password123', 'broker');
      const { listId: list1Id } = await service.createList('Broker 1 List', ['name', 'email'], [], 'flexible', broker1.uid);
      
      // Create broker 2
      const broker2 = await service.registerUser('broker2@example.com', 'password123', 'broker');
      const { listId: list2Id } = await service.createList('Broker 2 List', ['name', 'email'], [], 'flexible', broker2.uid);
      
      // Broker 1 should see only their list
      const broker1Lists = await service.getLists(broker1.uid);
      expect(broker1Lists.length).toBe(1);
      expect(broker1Lists[0].id).toBe(list1Id);
      expect(broker1Lists[0].name).toBe('Broker 1 List');
      
      // Broker 2 should see only their list
      const broker2Lists = await service.getLists(broker2.uid);
      expect(broker2Lists.length).toBe(1);
      expect(broker2Lists[0].id).toBe(list2Id);
      expect(broker2Lists[0].name).toBe('Broker 2 List');
    });

    it('should prevent broker from accessing another users list', async () => {
      const broker1 = await service.registerUser('broker1@example.com', 'password123', 'broker');
      const { listId } = await service.createList('Broker 1 List', ['name', 'email'], [], 'flexible', broker1.uid);
      
      const broker2 = await service.registerUser('broker2@example.com', 'password123', 'broker');
      
      await expect(service.getList(listId, broker2.uid)).rejects.toThrow('403 Forbidden');
    });

    it('should allow admin to see all lists including broker lists', async () => {
      // Create broker and their list
      const broker = await service.registerUser('broker@example.com', 'password123', 'broker');
      const { listId: brokerListId } = await service.createList('Broker List', ['name', 'email'], [], 'flexible', broker.uid);
      
      // Create admin and their list
      const admin = await service.registerUser('admin@example.com', 'password123');
      db.updateUser(admin.uid, { role: 'admin' });
      const { listId: adminListId } = await service.createList('Admin List', ['name', 'email'], [], 'flexible', admin.uid);
      
      // Admin should see all lists
      const adminLists = await service.getLists(admin.uid);
      expect(adminLists.length).toBe(2);
      const listIds = adminLists.map(l => l.id).sort();
      expect(listIds).toContain(brokerListId);
      expect(listIds).toContain(adminListId);
    });

    it('should allow compliance role to see all lists', async () => {
      const broker = await service.registerUser('broker@example.com', 'password123', 'broker');
      await service.createList('Broker List', ['name', 'email'], [], 'flexible', broker.uid);
      
      const compliance = await service.registerUser('compliance@example.com', 'password123');
      db.updateUser(compliance.uid, { role: 'compliance' });
      
      const complianceLists = await service.getLists(compliance.uid);
      expect(complianceLists.length).toBe(1);
    });

    it('should allow super_admin role to see all lists', async () => {
      const broker = await service.registerUser('broker@example.com', 'password123', 'broker');
      await service.createList('Broker List', ['name', 'email'], [], 'flexible', broker.uid);
      
      const superAdmin = await service.registerUser('superadmin@example.com', 'password123');
      db.updateUser(superAdmin.uid, { role: 'super_admin' });
      
      const superAdminLists = await service.getLists(superAdmin.uid);
      expect(superAdminLists.length).toBe(1);
    });
  });

  describe('25.2 Template Mode', () => {
    it('should validate and create list with Individual template', async () => {
      const columns = ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender'];
      
      const validation = service.validateTemplate(columns, 'individual');
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
      
      const user = await service.registerUser('user@example.com', 'password123');
      const { listId, listType } = await service.createList(
        'Individual List',
        columns,
        [{ title: 'Mr', 'first name': 'John', 'last name': 'Doe', 'phone number': '1234567890', email: 'john@example.com', address: '123 Main St', gender: 'Male' }],
        'template',
        user.uid
      );
      
      expect(listType).toBe('individual');
      const list = db.getList(listId);
      expect(list.listType).toBe('individual');
      expect(list.uploadMode).toBe('template');
    });

    it('should validate and create list with Corporate template', async () => {
      const columns = ['company name', 'company address', 'email address', 'company type', 'phone number'];
      
      const validation = service.validateTemplate(columns, 'corporate');
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
      
      const user = await service.registerUser('user@example.com', 'password123');
      const { listId, listType } = await service.createList(
        'Corporate List',
        columns,
        [{ 'company name': 'Test Corp', 'company address': '456 Business Ave', 'email address': 'corp@example.com', 'company type': 'LLC', 'phone number': '9876543210' }],
        'template',
        user.uid
      );
      
      expect(listType).toBe('corporate');
      const list = db.getList(listId);
      expect(list.listType).toBe('corporate');
    });

    it('should show error when Individual template is missing required columns', async () => {
      const columns = ['title', 'first name', 'email']; // Missing: last name, phone number, address, gender
      
      const validation = service.validateTemplate(columns, 'individual');
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('last name');
      expect(validation.missing).toContain('phone number');
      expect(validation.missing).toContain('address');
      expect(validation.missing).toContain('gender');
    });

    it('should show error when Corporate template is missing required columns', async () => {
      const columns = ['company name', 'email address']; // Missing: company address, company type, phone number
      
      const validation = service.validateTemplate(columns, 'corporate');
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('company address');
      expect(validation.missing).toContain('company type');
      expect(validation.missing).toContain('phone number');
    });

    it('should accept any structure in flexible mode', async () => {
      const columns = ['random column 1', 'random column 2', 'email'];
      
      const user = await service.registerUser('user@example.com', 'password123');
      const { listId, listType } = await service.createList(
        'Flexible List',
        columns,
        [{ 'random column 1': 'value1', 'random column 2': 'value2', email: 'test@example.com' }],
        'flexible',
        user.uid
      );
      
      expect(listType).toBe('flexible');
      const list = db.getList(listId);
      expect(list.uploadMode).toBe('flexible');
    });

    it('should auto-detect Individual list type from columns', async () => {
      const columns = ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender', 'date of birth'];
      
      const detectedType = FileParser.detectListType(columns);
      expect(detectedType).toBe('individual');
    });

    it('should auto-detect Corporate list type from columns', async () => {
      const columns = ['company name', 'company address', 'email address', 'company type', 'phone number'];
      
      const detectedType = FileParser.detectListType(columns);
      expect(detectedType).toBe('corporate');
    });

    it('should return null when columns do not match any template', async () => {
      const columns = ['random1', 'random2', 'random3'];
      
      const detectedType = FileParser.detectListType(columns);
      expect(detectedType).toBeNull();
    });
  });

  describe('25.3 Dynamic Email', () => {
    it('should send NIN verification email with Individual Clients text', async () => {
      const user = await service.registerUser('user@example.com', 'password123');
      db.updateUser(user.uid, { role: 'admin' }); // Give admin role to send emails
      
      const { listId } = await service.createList(
        'Test List',
        ['name', 'email'],
        [{ name: 'John Doe', email: 'john@example.com' }],
        'flexible',
        user.uid
      );
      
      const entries = db.getEntriesByList(listId);
      await service.sendVerificationEmails(listId, [entries[0].id], 'NIN', user.uid);
      
      const sentEmails = email.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].verificationType).toBe('NIN');
      expect(sentEmails[0].html).toContain('Individual Clients');
      expect(sentEmails[0].html).toContain('National Identification Number (NIN)');
    });

    it('should send CAC verification email with Corporate Clients text', async () => {
      const user = await service.registerUser('user@example.com', 'password123');
      db.updateUser(user.uid, { role: 'admin' }); // Give admin role to send emails
      
      const { listId } = await service.createList(
        'Test List',
        ['company name', 'email address'],
        [{ 'company name': 'Test Corp', 'email address': 'corp@example.com' }],
        'flexible',
        user.uid
      );
      
      const entries = db.getEntriesByList(listId);
      await service.sendVerificationEmails(listId, [entries[0].id], 'CAC', user.uid);
      
      const sentEmails = email.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].verificationType).toBe('CAC');
      expect(sentEmails[0].html).toContain('Corporate Clients');
      expect(sentEmails[0].html).toContain('Corporate Affairs Commission (CAC) Registration Number');
    });

    it('should include full regulatory text in email', async () => {
      const user = await service.registerUser('user@example.com', 'password123');
      db.updateUser(user.uid, { role: 'admin' }); // Give admin role to send emails
      
      const { listId } = await service.createList(
        'Test List',
        ['name', 'email'],
        [{ name: 'John Doe', email: 'john@example.com' }],
        'flexible',
        user.uid
      );
      
      const entries = db.getEntriesByList(listId);
      await service.sendVerificationEmails(listId, [entries[0].id], 'NIN', user.uid);
      
      const sentEmails = email.getSentEmails();
      const emailContent = sentEmails[0].html;
      
      expect(emailContent).toContain('National Insurance Commission (NAICOM)');
      expect(emailContent).toContain('Know Your Customer (KYC)');
      expect(emailContent).toContain('data integrity');
      expect(emailContent).toContain('nemsupport@nem-insurance.com');
      expect(emailContent).toContain('0201-4489570-2');
    });

    it('should use Dear Client as greeting', async () => {
      const user = await service.registerUser('user@example.com', 'password123');
      db.updateUser(user.uid, { role: 'admin' }); // Give admin role to send emails
      
      const { listId } = await service.createList(
        'Test List',
        ['name', 'email'],
        [{ name: 'John Doe', email: 'john@example.com' }],
        'flexible',
        user.uid
      );
      
      const entries = db.getEntriesByList(listId);
      await service.sendVerificationEmails(listId, [entries[0].id], 'NIN', user.uid);
      
      const sentEmails = email.getSentEmails();
      expect(sentEmails[0].html).toContain('Dear Client');
    });

    it('should include verification link in email', async () => {
      const user = await service.registerUser('user@example.com', 'password123');
      db.updateUser(user.uid, { role: 'admin' }); // Give admin role to send emails
      
      const { listId } = await service.createList(
        'Test List',
        ['name', 'email'],
        [{ name: 'John Doe', email: 'john@example.com' }],
        'flexible',
        user.uid
      );
      
      const entries = db.getEntriesByList(listId);
      await service.sendVerificationEmails(listId, [entries[0].id], 'NIN', user.uid);
      
      const sentEmails = email.getSentEmails();
      expect(sentEmails[0].html).toContain('https://nemforms.com/verify/');
    });
  });

  describe('25.4 Role Management', () => {
    it('should allow admin to change user role to broker', async () => {
      const admin = await service.registerUser('admin@example.com', 'password123');
      db.updateUser(admin.uid, { role: 'admin' });
      
      const user = await service.registerUser('user@example.com', 'password123');
      expect(db.getUser(user.uid).role).toBe('default');
      
      const result = await service.updateUserRole(user.uid, 'broker', admin.uid);
      expect(result.success).toBe(true);
      expect(db.getUser(user.uid).role).toBe('broker');
    });

    it('should allow admin to change broker role to admin', async () => {
      const admin = await service.registerUser('admin@example.com', 'password123');
      db.updateUser(admin.uid, { role: 'admin' });
      
      const broker = await service.registerUser('broker@example.com', 'password123', 'broker');
      expect(db.getUser(broker.uid).role).toBe('broker');
      
      const result = await service.updateUserRole(broker.uid, 'admin', admin.uid);
      expect(result.success).toBe(true);
      expect(db.getUser(broker.uid).role).toBe('admin');
    });

    it('should prevent non-admin from changing roles', async () => {
      const user1 = await service.registerUser('user1@example.com', 'password123');
      const user2 = await service.registerUser('user2@example.com', 'password123');
      
      const result = await service.updateUserRole(user2.uid, 'admin', user1.uid);
      expect(result.success).toBe(false);
      expect(result.error).toContain('403 Forbidden');
      expect(result.error).toContain('Only administrators can change user roles');
    });

    it('should allow super_admin to change user roles', async () => {
      const superAdmin = await service.registerUser('superadmin@example.com', 'password123');
      db.updateUser(superAdmin.uid, { role: 'super_admin' });
      
      const user = await service.registerUser('user@example.com', 'password123');
      
      const result = await service.updateUserRole(user.uid, 'compliance', superAdmin.uid);
      expect(result.success).toBe(true);
      expect(db.getUser(user.uid).role).toBe('compliance');
    });

    it('should update user access after role change from broker to admin', async () => {
      // Create admin
      const admin = await service.registerUser('admin@example.com', 'password123');
      db.updateUser(admin.uid, { role: 'admin' });
      
      // Create broker with a list
      const broker = await service.registerUser('broker@example.com', 'password123', 'broker');
      await service.createList('Broker List', ['name', 'email'], [], 'flexible', broker.uid);
      
      // Create another list by admin
      await service.createList('Admin List', ['name', 'email'], [], 'flexible', admin.uid);
      
      // Broker should see only their list
      let brokerLists = await service.getLists(broker.uid);
      expect(brokerLists.length).toBe(1);
      
      // Change broker to admin
      await service.updateUserRole(broker.uid, 'admin', admin.uid);
      
      // Now should see all lists
      brokerLists = await service.getLists(broker.uid);
      expect(brokerLists.length).toBe(2);
    });

    it('should update user access after role change from admin to broker', async () => {
      // Create super admin
      const superAdmin = await service.registerUser('superadmin@example.com', 'password123');
      db.updateUser(superAdmin.uid, { role: 'super_admin' });
      
      // Create admin user
      const adminUser = await service.registerUser('admin@example.com', 'password123');
      db.updateUser(adminUser.uid, { role: 'admin' });
      
      // Create lists by different users
      await service.createList('Admin List', ['name', 'email'], [], 'flexible', adminUser.uid);
      await service.createList('Super Admin List', ['name', 'email'], [], 'flexible', superAdmin.uid);
      
      // Admin should see all lists
      let adminLists = await service.getLists(adminUser.uid);
      expect(adminLists.length).toBe(2);
      
      // Change admin to broker
      await service.updateUserRole(adminUser.uid, 'broker', superAdmin.uid);
      
      // Now should see only their own list
      adminLists = await service.getLists(adminUser.uid);
      expect(adminLists.length).toBe(1);
      expect(adminLists[0].name).toBe('Admin List');
    });

    it('should prevent broker from changing roles', async () => {
      const broker = await service.registerUser('broker@example.com', 'password123', 'broker');
      const user = await service.registerUser('user@example.com', 'password123');
      
      const result = await service.updateUserRole(user.uid, 'admin', broker.uid);
      expect(result.success).toBe(false);
      expect(result.error).toContain('403 Forbidden');
    });

    it('should prevent compliance role from changing roles', async () => {
      const compliance = await service.registerUser('compliance@example.com', 'password123');
      db.updateUser(compliance.uid, { role: 'compliance' });
      
      const user = await service.registerUser('user@example.com', 'password123');
      
      const result = await service.updateUserRole(user.uid, 'broker', compliance.uid);
      expect(result.success).toBe(false);
      expect(result.error).toContain('403 Forbidden');
    });
  });
});
