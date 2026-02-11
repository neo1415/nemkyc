import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  User,
  Building,
  Building2,
  FileCheck,
  Lock,
  Info,
  BadgeCheck,
  Clock,
  XCircle,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '../../assets/NEMs-Logo.jpg';
import type { 
  PublicRecordInfo, 
  VerificationType,
  TokenValidationResponse as IdentityTokenValidationResponse
} from '../../types/remediation';

// Page states
type PageState = 'loading' | 'valid' | 'expired' | 'used' | 'invalid' | 'error';

// Verification states
type VerificationState = 'idle' | 'verifying' | 'success' | 'failed';

// Combined entry info that works with both legacy and new systems
interface EntryInfo {
  name?: string;
  policyNumber?: string;
  brokerName?: string;
  verificationType: VerificationType;
  expiresAt?: Date;
  // Enhanced fields for field-level validation display (Requirement 20.1, 20.2, 20.4, 20.5)
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  companyName?: string;
  registrationNumber?: string;
  registrationDate?: string;
}

// Legacy token validation response (for backward compatibility)
interface LegacyTokenValidationResponse {
  valid: boolean;
  record?: PublicRecordInfo;
  expired?: boolean;
  used?: boolean;
  message?: string;
  brokerName?: string;
  error?: string;
}

interface VerificationResponse {
  success: boolean;
  verified?: boolean;
  matchScore?: number;
  error?: string;
  attemptsRemaining?: number;
}

const CustomerVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  
  // Page state
  const [pageState, setPageState] = useState<PageState>('loading');
  const [entryInfo, setEntryInfo] = useState<EntryInfo | null>(null);
  const [brokerName, setBrokerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Form state
  const [identityNumber, setIdentityNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  
  // Verification state
  const [verificationState, setVerificationState] = useState<VerificationState>('idle');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [verificationError, setVerificationError] = useState<string>('');
  
  // Track which API system we're using
  const [apiSystem, setApiSystem] = useState<'identity' | 'remediation'>('identity');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // Validate token on mount - try identity API first, fall back to remediation API
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setPageState('invalid');
        setErrorMessage('No verification token provided.');
        return;
      }

      // Try the new identity API first
      try {
        const identityResponse = await fetch(`${API_BASE_URL}/api/identity/verify/${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (identityResponse.ok) {
          const data: IdentityTokenValidationResponse = await identityResponse.json();
          
          if (data.valid && data.entryInfo) {
            setApiSystem('identity');
            setEntryInfo({
              name: data.entryInfo.name,
              policyNumber: data.entryInfo.policyNumber,
              verificationType: data.entryInfo.verificationType,
              expiresAt: data.entryInfo.expiresAt ? new Date(data.entryInfo.expiresAt) : undefined,
              // Enhanced fields (Requirement 20.1, 20.2, 20.4, 20.5)
              firstName: data.entryInfo.firstName,
              lastName: data.entryInfo.lastName,
              email: data.entryInfo.email,
              dateOfBirth: data.entryInfo.dateOfBirth,
              companyName: data.entryInfo.companyName,
              registrationNumber: data.entryInfo.registrationNumber,
              registrationDate: data.entryInfo.registrationDate,
            });
            setPageState('valid');
            return;
          } else if (data.expired) {
            setPageState('expired');
            setErrorMessage('This verification link has expired. Please contact your insurance provider for a new link.');
            return;
          } else if (data.used) {
            setPageState('used');
            setErrorMessage('Your information has already been submitted. Thank you.');
            return;
          }
        }
      } catch (identityError) {
        console.log('Identity API not available, trying remediation API...');
      }

      // Fall back to legacy remediation API
      try {
        const response = await fetch(`${API_BASE_URL}/api/remediation/verify/${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        const data: LegacyTokenValidationResponse = await response.json();

        if (data.valid && data.record) {
          setApiSystem('remediation');
          // Map legacy record to unified entry info
          setEntryInfo({
            name: data.record.customerName,
            policyNumber: data.record.policyNumber,
            brokerName: data.record.brokerName,
            // Map legacy identityType to new verificationType
            verificationType: data.record.identityType === 'individual' ? 'NIN' : 'CAC',
          });
          setPageState('valid');
        } else if (data.expired) {
          setPageState('expired');
          setBrokerName(data.brokerName || '');
          setErrorMessage(data.message || 'This verification link has expired.');
        } else if (data.used) {
          setPageState('used');
          setErrorMessage(data.message || 'Your identity has already been verified.');
        } else {
          setPageState('invalid');
          setErrorMessage(data.error || 'Invalid verification link.');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setPageState('error');
        setErrorMessage('Unable to validate verification link. Please try again later.');
      }
    };

    validateToken();
  }, [token, API_BASE_URL]);

  // Format identity number input based on verification type
  const formatIdentityNumber = (value: string, type: VerificationType) => {
    if (type === 'NIN') {
      // NIN: 11 digits only
      return value.replace(/\D/g, '').slice(0, 11);
    }
    // CAC: Allow alphanumeric (RC numbers can have letters)
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
  };

  // Validate NIN format (exactly 11 digits)
  const isValidNIN = (nin: string): boolean => {
    return /^\d{11}$/.test(nin);
  };

  // Validate CAC inputs
  const isValidCAC = (cacNumber: string): boolean => {
    return cacNumber.trim().length > 0;
  };

  // Handle verification submission
  const handleVerify = async () => {
    if (!entryInfo) return;

    const isNIN = entryInfo.verificationType === 'NIN';

    // Validate input based on verification type
    if (isNIN) {
      if (!isValidNIN(identityNumber)) {
        toast.error('Please enter a valid 11-digit NIN.');
        return;
      }
    } else {
      if (!isValidCAC(identityNumber)) {
        toast.error('Please enter a valid CAC number.');
        return;
      }
    }

    setVerificationState('verifying');
    setVerificationError('');

    try {
      // Use the appropriate API based on which system validated the token
      const apiEndpoint = apiSystem === 'identity' 
        ? `${API_BASE_URL}/api/identity/verify/${token}`
        : `${API_BASE_URL}/api/remediation/verify/${token}`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identityNumber,
          // Company name is not sent by customer - backend will use stored data for validation
          demoMode,
        }),
      });

      const data: VerificationResponse = await response.json();

      if (data.success || data.verified) {
        setVerificationState('success');
        toast.success('Identity verified successfully!');
      } else {
        setVerificationState('failed');
        setVerificationError(data.error || 'Verification failed. Please check your information and try again.');
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationState('failed');
      setVerificationError('Network error. Please try again.');
      toast.error('Verification failed. Please try again.');
    }
  };

  // Render loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Validating your verification link...</p>
        </div>
      </div>
    );
  }

  // Render expired state
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Link Expired</h2>
              <p className="text-slate-600 mb-6">{errorMessage}</p>
              
              {brokerName && (
                <Alert className="bg-blue-50 border-blue-200 text-left">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Please contact your broker <strong>{brokerName}</strong> to request a new verification link.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          <Footer />
        </main>
      </div>
    );
  }

  // Render already verified state
  if (pageState === 'used') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Already Verified</h2>
              <p className="text-slate-600">{errorMessage}</p>
            </CardContent>
          </Card>
          <Footer />
        </main>
      </div>
    );
  }

  // Render invalid/error state
  if (pageState === 'invalid' || pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Invalid Link</h2>
              <p className="text-slate-600 mb-6">{errorMessage}</p>
              
              <Alert className="bg-blue-50 border-blue-200 text-left">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  If you believe this is an error, please contact your insurance provider for assistance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <Footer />
        </main>
      </div>
    );
  }

  // Render verification success state
  if (verificationState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Successful!</h2>
              <p className="text-slate-600 mb-6">
                Your identity has been verified successfully. Thank you for completing this process.
              </p>
              
              {entryInfo && (entryInfo.name || entryInfo.policyNumber || entryInfo.brokerName) && (
                <div className="bg-slate-50 rounded-xl p-6 text-left">
                  <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
                    Verification Details
                  </h4>
                  <div className="space-y-3">
                    {entryInfo.name && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name</span>
                        <span className="font-semibold text-slate-900">{entryInfo.name}</span>
                      </div>
                    )}
                    {entryInfo.policyNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Policy Number</span>
                        <span className="font-semibold text-slate-900">{entryInfo.policyNumber}</span>
                      </div>
                    )}
                    {entryInfo.brokerName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Broker</span>
                        <span className="font-semibold text-slate-900">{entryInfo.brokerName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Footer />
        </main>
      </div>
    );
  }

  // Render main verification form (valid state)
  const isNIN = entryInfo?.verificationType === 'NIN';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${isNIN ? 'from-indigo-50 via-white to-blue-50' : 'from-emerald-50 via-white to-teal-50'}`}>
      <Header demoMode={demoMode} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Regulatory Context Card */}
        <Card className={`mb-6 border-0 shadow-lg bg-gradient-to-r ${isNIN ? 'from-indigo-600 to-blue-600' : 'from-emerald-600 to-teal-600'} text-white overflow-hidden`}>
          <CardContent className="py-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-5 h-5" />
                <span className={`text-sm font-medium ${isNIN ? 'text-indigo-200' : 'text-emerald-200'}`}>
                  Regulatory Compliance
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2">
                {isNIN ? 'NIN Verification Required' : 'CAC Verification Required'}
              </h2>
              <p className={`text-sm leading-relaxed ${isNIN ? 'text-indigo-100' : 'text-emerald-100'}`}>
                {isNIN 
                  ? 'In accordance with CBN regulations and the Money Laundering (Prevention and Prohibition) Act, we need to verify your identity using your National Identification Number (NIN).'
                  : 'As required by NAICOM and the Companies and Allied Matters Act (CAMA), we need to verify your company\'s CAC registration details.'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info Card - Prominently display name for identity confirmation */}
        {entryInfo && (
          <Card className="mb-6 shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              {/* Prominent Name Display */}
              {entryInfo.name && (
                <div className="text-center mb-6 pb-4 border-b border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Verifying identity for</p>
                  <h2 className="text-2xl font-bold text-slate-900">{entryInfo.name}</h2>
                  <p className="text-xs text-slate-400 mt-2">
                    Please ensure this name matches your {isNIN ? 'NIN' : 'CAC'} registration
                  </p>
                </div>
              )}
              
              {/* Enhanced field display based on verification type (Requirement 20.1, 20.2, 20.4, 20.5) */}
              <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
                {isNIN ? 'Individual Client Information' : 'Corporate Client Information'}
              </h3>
              <div className="space-y-3">
                {/* For NIN: Display First Name, Last Name, Email, Date of Birth (Requirement 20.1) */}
                {isNIN && (
                  <>
                    {entryInfo.firstName && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-500">First Name</span>
                        <span className="font-semibold text-slate-900">{entryInfo.firstName}</span>
                      </div>
                    )}
                    {entryInfo.lastName && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-500">Last Name</span>
                        <span className="font-semibold text-slate-900">{entryInfo.lastName}</span>
                      </div>
                    )}
                    {entryInfo.email && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-500">Email</span>
                        <span className="font-semibold text-slate-900">{entryInfo.email}</span>
                      </div>
                    )}
                    {entryInfo.dateOfBirth && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-500">Date of Birth</span>
                        <span className="font-semibold text-slate-900">{entryInfo.dateOfBirth}</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* For CAC: Display Company Name, Registration Number, Registration Date (Requirement 20.4) */}
                {!isNIN && (
                  <>
                    {entryInfo.companyName && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-500">Company Name</span>
                        <span className="font-semibold text-slate-900">{entryInfo.companyName}</span>
                      </div>
                    )}
                    {entryInfo.registrationNumber && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-500">Registration Number</span>
                        <span className="font-semibold text-slate-900">{entryInfo.registrationNumber}</span>
                      </div>
                    )}
                    {entryInfo.registrationDate && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-500">Registration Date</span>
                        <span className="font-semibold text-slate-900">{entryInfo.registrationDate}</span>
                      </div>
                    )}
                  </>
                )}
                
                {!entryInfo.name && !entryInfo.firstName && !entryInfo.companyName && (
                  <Alert className="bg-amber-50 border-amber-200 mb-4">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      No name information available. Please ensure you are the intended recipient of this verification request.
                    </AlertDescription>
                  </Alert>
                )}
                {entryInfo.policyNumber && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Policy Number</span>
                    <span className="font-semibold text-slate-900">{entryInfo.policyNumber}</span>
                  </div>
                )}
                {entryInfo.brokerName && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Broker</span>
                    <span className="font-semibold text-slate-900">{entryInfo.brokerName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500">Verification Type</span>
                  <Badge className={isNIN ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}>
                    {isNIN ? 'NIN' : 'CAC'}
                  </Badge>
                </div>
              </div>
              
              {/* Identity Validation Notice (Requirement 20.2, 20.5) */}
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  {isNIN 
                    ? 'Your NIN will be validated against the information shown above. Please ensure your NIN matches these details.'
                    : 'Your CAC will be validated against the company information shown above. Please ensure your CAC matches these details.'
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Shield className={`w-6 h-6 mx-auto mb-2 ${isNIN ? 'text-indigo-600' : 'text-emerald-600'}`} />
            <p className="text-xs text-slate-600 font-medium">Bank-Grade Security</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Building2 className={`w-6 h-6 mx-auto mb-2 ${isNIN ? 'text-indigo-600' : 'text-emerald-600'}`} />
            <p className="text-xs text-slate-600 font-medium">{isNIN ? 'CBN Regulated' : 'NAICOM Regulated'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <BadgeCheck className={`w-6 h-6 mx-auto mb-2 ${isNIN ? 'text-indigo-600' : 'text-emerald-600'}`} />
            <p className="text-xs text-slate-600 font-medium">{isNIN ? 'NIMC Verified' : 'CAC Verified'}</p>
          </div>
        </div>

        {/* Main Verification Card */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isNIN ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                {isNIN 
                  ? <User className="w-8 h-8 text-indigo-600" />
                  : <Building className="w-8 h-8 text-emerald-600" />
                }
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {isNIN ? 'Verify Your Identity' : 'Verify Your Company'}
              </h3>
              <p className="text-slate-500 text-sm">
                {isNIN 
                  ? 'Enter your 11-digit National Identification Number (NIN)'
                  : 'Enter your CAC registration details'
                }
              </p>
            </div>

            <div className="space-y-6">
              {/* Demo Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800">Demo Mode (simulated verification)</span>
                </div>
                <button
                  onClick={() => setDemoMode(!demoMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    demoMode ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle demo mode"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      demoMode ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* NIN Input (11 digits) - Requirement 20.2 */}
              {isNIN && (
                <div className="space-y-2">
                  <Label htmlFor="identityNumber" className="text-sm font-semibold text-slate-700">
                    National Identification Number (NIN)
                  </Label>
                  <Input
                    id="identityNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter your 11-digit NIN"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(formatIdentityNumber(e.target.value, 'NIN'))}
                    className="text-center text-xl tracking-wider font-mono h-12 border-2 focus:border-indigo-500"
                    maxLength={11}
                    disabled={verificationState === 'verifying'}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Test NIN: 22222222221</span>
                    <span>{identityNumber.length}/11 digits</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Only your NIN is required. We will validate it against the information shown above.
                  </p>
                </div>
              )}

              {/* CAC Input (number only) - Requirement 20.5 */}
              {!isNIN && (
                <div className="space-y-2">
                  <Label htmlFor="identityNumber" className="text-sm font-semibold text-slate-700">
                    CAC/RC Registration Number
                  </Label>
                  <Input
                    id="identityNumber"
                    type="text"
                    placeholder="e.g., RC123456 or BN1234567"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(formatIdentityNumber(e.target.value, 'CAC'))}
                    className="h-12 border-2 focus:border-emerald-500"
                    maxLength={15}
                    disabled={verificationState === 'verifying'}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Only your CAC number is required. We will validate it against the company information shown above.
                  </p>
                </div>
              )}

              {/* Verification Error */}
              {verificationState === 'failed' && verificationError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <p className="font-semibold">Verification Failed</p>
                      <p>{verificationError}</p>
                      {attemptsRemaining > 0 && (
                        <p className="font-medium">
                          Attempts remaining: {attemptsRemaining}
                        </p>
                      )}
                      {attemptsRemaining === 0 && (
                        <div className="mt-3 pt-3 border-t border-red-300">
                          <p className="font-semibold mb-2">Need Help?</p>
                          <p className="text-sm">
                            Please contact your broker or NEM Insurance support:
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            {entryInfo?.brokerName && (
                              <p>Broker: <strong>{entryInfo.brokerName}</strong></p>
                            )}
                            <p>Email: <strong>nemsupport@nem-insurance.com</strong></p>
                            <p>Phone: <strong>0201-4489570-2</strong></p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleVerify}
                disabled={
                  verificationState === 'verifying' ||
                  (isNIN && !isValidNIN(identityNumber)) ||
                  (!isNIN && !isValidCAC(identityNumber)) ||
                  attemptsRemaining === 0
                }
                className={`w-full h-12 text-base font-semibold ${isNIN ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {verificationState === 'verifying' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    {isNIN ? 'Verify NIN' : 'Verify CAC'}
                  </>
                )}
              </Button>

              {/* Contact Support Button */}
              {verificationState === 'failed' && (
                <Button
                  onClick={() => {
                    window.location.href = 'mailto:nemsupport@nem-insurance.com?subject=Verification%20Assistance%20Required';
                  }}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-2"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Support
                </Button>
              )}

              {attemptsRemaining === 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Maximum verification attempts reached. Please contact your insurance provider for assistance.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-6 space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Why do we need this information?</strong>{' '}
              {isNIN 
                ? 'The Central Bank of Nigeria (CBN) requires all financial institutions to verify customer identities as part of Know Your Customer (KYC) and Anti-Money Laundering (AML) compliance.'
                : 'The National Insurance Commission (NAICOM) requires all insurance companies to verify corporate customer identities as part of Know Your Customer (KYC) and Anti-Money Laundering (AML) compliance under CAMA 2020.'
              }
            </AlertDescription>
          </Alert>
        </div>

        <Footer />
      </main>
    </div>
  );
};

// Header component
const Header: React.FC<{ demoMode?: boolean }> = ({ demoMode }) => (
  <header className="bg-white border-b border-slate-200">
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="NEM Insurance" className="w-12 h-12 rounded-xl shadow-md" />
          <div>
            <h1 className="font-bold text-slate-900">NEM Insurance Plc</h1>
            <p className="text-xs text-slate-500">Identity Verification Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Lock className="w-3 h-3 mr-1" />
            Secure
          </Badge>
          {demoMode && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              Demo Mode
            </Badge>
          )}
        </div>
      </div>
    </div>
  </header>
);

// Footer component
const Footer: React.FC = () => (
  <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
    <p>Your data is encrypted and processed securely.</p>
    <p>© {new Date().getFullYear()} NEM Insurance Plc. All rights reserved.</p>
  </div>
);

export default CustomerVerificationPage;
