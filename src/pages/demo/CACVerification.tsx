import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Building,
  Building2,
  FileCheck,
  Lock,
  ArrowLeft,
  Info,
  BadgeCheck,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '../../assets/NEMs-Logo.jpg';

interface VerificationResult {
  status: boolean;
  message: string;
  data?: {
    company_name?: string;
    rc_number?: string;
    company_type?: string;
    date_of_registration?: string;
    address?: string;
    status?: string;
  };
}

const CACVerification: React.FC = () => {
  const navigate = useNavigate();
  const [cacNumber, setCacNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [demoMode, setDemoMode] = useState(true); // Default to demo mode

  useEffect(() => {
    const savedKey = localStorage.getItem('paystack_secret_key');
    setIsConfigured(!!savedKey);
  }, [navigate]);

  const formatCAC = (value: string) => {
    // Allow alphanumeric for CAC (RC numbers can have letters)
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
  };

  const handleVerify = async () => {
    if (!cacNumber.trim()) {
      toast.error('Please enter a CAC/RC number');
      return;
    }

    if (!companyName.trim()) {
      toast.error('Please enter the company name');
      return;
    }

    const secretKey = localStorage.getItem('paystack_secret_key');
    if (!demoMode && !secretKey) {
      toast.error('API key not configured. Enable Demo Mode or configure API key.');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/api/verify/cac`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rc_number: cacNumber,
          company_name: companyName,
          secretKey: secretKey || '',
          demoMode: demoMode,
        }),
      });

      const data = await response.json();

      if (data.status) {
        setVerificationResult({
          status: true,
          message: data.message,
          data: data.data,
        });
        toast.success(data.message);
      } else {
        setVerificationResult({
          status: false,
          message: data.message || 'Verification failed',
        });
        toast.error(data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationResult({
        status: false,
        message: 'Network error. Please try again.',
      });
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Trust Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="NEM Insurance" className="w-12 h-12 rounded-xl shadow-md" />
              <div>
                <h1 className="font-bold text-slate-900">NEM Insurance Plc</h1>
                <p className="text-xs text-slate-500">Corporate Identity Verification</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Lock className="w-3 h-3 mr-1" />
              Secure
            </Badge>
            {demoMode && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 ml-2">
                Demo Mode
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/demo/config')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Configuration</span>
        </button>

        {/* Regulatory Context Card */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white overflow-hidden">
          <CardContent className="py-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-5 h-5" />
                <span className="text-sm font-medium text-emerald-200">Corporate Compliance</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Corporate Affairs Commission (CAC) Verification</h2>
              <p className="text-emerald-100 text-sm leading-relaxed">
                As required by NAICOM and the Companies and Allied Matters Act (CAMA), all corporate 
                insurance customers must provide valid CAC registration details. This verification 
                ensures your company's legitimacy and compliance with Nigerian business regulations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Shield className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">Bank-Grade Security</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Building2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">NAICOM Regulated</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <BadgeCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">CAC Verified</p>
          </div>
        </div>

        {/* Main Verification Card */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-8">
            {!verificationResult?.status ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Verify Your Company</h3>
                  <p className="text-slate-500 text-sm">
                    Enter your CAC registration details below
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
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          demoMode ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cacNumber" className="text-sm font-semibold text-slate-700">
                      RC Number / CAC Registration Number
                    </Label>
                    <Input
                      id="cacNumber"
                      type="text"
                      placeholder="e.g., RC123456 or BN1234567"
                      value={cacNumber}
                      onChange={(e) => setCacNumber(formatCAC(e.target.value))}
                      className="text-center text-xl tracking-wider font-mono h-12 border-2 focus:border-emerald-500"
                      disabled={isVerifying}
                    />
                    <p className="text-xs text-slate-400">
                      Enter your company's RC number as shown on your CAC certificate
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
                      Registered Company Name
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Enter company name as registered with CAC"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-12 border-2 focus:border-emerald-500"
                      disabled={isVerifying}
                    />
                    <p className="text-xs text-slate-400">
                      Must match the name on your CAC registration certificate
                    </p>
                  </div>

                  <Button
                    onClick={handleVerify}
                    disabled={!cacNumber.trim() || !companyName.trim() || isVerifying}
                    className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-5 h-5 mr-2" />
                        Verify Company
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Verification Successful!</h3>
                <p className="text-slate-500 mb-6">Your company has been verified</p>
                
                {verificationResult.data && (
                  <div className="bg-slate-50 rounded-xl p-6 text-left mb-6">
                    <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
                      Verified Company Information
                    </h4>
                    <div className="space-y-3">
                      {verificationResult.data.company_name && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Company Name</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.company_name}</span>
                        </div>
                      )}
                      {verificationResult.data.rc_number && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">RC Number</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.rc_number}</span>
                        </div>
                      )}
                      {verificationResult.data.company_type && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Company Type</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.company_type}</span>
                        </div>
                      )}
                      {verificationResult.data.date_of_registration && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Registration Date</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.date_of_registration}</span>
                        </div>
                      )}
                      {verificationResult.data.status && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Status</span>
                          <Badge className="bg-green-100 text-green-700">{verificationResult.data.status}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setCacNumber('');
                    setCompanyName('');
                    setVerificationResult(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Verify Another Company
                </Button>
              </div>
            )}

            {/* Error State */}
            {verificationResult && !verificationResult.status && (
              <Alert className="mt-6 bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {verificationResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-6 space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Why do we need your CAC details?</strong> The National Insurance Commission (NAICOM) 
              requires all insurance companies to verify corporate customer identities as part of Know Your 
              Customer (KYC) and Anti-Money Laundering (AML) compliance under CAMA 2020.
            </AlertDescription>
          </Alert>

          <div className="text-center text-xs text-slate-400 space-y-1">
            <p>Your data is encrypted and processed securely via CAC-approved channels.</p>
            <p>© {new Date().getFullYear()} NEM Insurance Plc. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CACVerification;
