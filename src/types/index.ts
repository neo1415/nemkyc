
export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'default' | 'admin' | 'compliance' | 'superAdmin';
  notificationPreference: 'email' | 'sms';
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  id: string;
  userId: string;
  formType: string;
  data: Record<string, any>;
  status: 'processing' | 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ClaimSubmission extends Submission {
  claimType: 'motor' | 'money' | 'burglary' | 'travel' | 'public-liability' | 
            'combined-gpa' | 'personal-accident' | 'fire' | 'marine' | 
            'professional-indemnity' | 'houseowners' | 'householders' | 
            'goods-in-transit' | 'group-life';
  claimAmount?: number;
  incidentDate?: Date;
}

export interface KYCSubmission extends Submission {
  kycType: 'individual-kyc' | 'corporate-kyc';
}

export interface CDDSubmission extends Submission {
  cddType: 'corporate' | 'naicom-corporate' | 'partners' | 'naicom-partners' | 
           'agents' | 'brokers' | 'individual';
  isNaicomApproved?: boolean;
}

export type FormType = 'kyc' | 'cdd' | 'claims';
export type UserRole = 'default' | 'admin' | 'compliance' | 'superAdmin';
