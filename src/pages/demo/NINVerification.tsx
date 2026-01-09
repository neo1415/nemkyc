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
  User,
  Building2,
  FileCheck,
  Lock,
  ArrowLeft,
  Info,
  BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '../../assets/NEMs-Logo.jpg';

interface VerificationResult {
  status: boolean;
  message: string;
  data?: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    formatted_dob?: string;
    mobile?: string;
    nationality?: string;
  };
}

const BVNVerification: React.FC = () => {
  const navigate = useNavigate();
  const [bvn, setBvn] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [demoMode, setDemoMode] = useState(true); // Default to demo mode

  useEffect(() => {
    const savedKey = localStorage.getItem('paystack_secret_key');
    setIsConfigured(!!savedKey);
    // Don't redirect if in demo mode
  }, [navigate]);

  const formatBVN = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const handleVerify = async () => {
    if (bvn.length !== 11) {
      toast.error('BVN must be exactly 11 digits');
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
      
      const response = await fetch(`${API_BASE_URL}/api/verify/nin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nin: bvn,
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Trust Header */}
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
        <button
          onClick={() => navigate('/demo/config')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Configuration</span>
        </button>

        {/* Regulatory Context Card */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white overflow-hidden">
          <CardContent className="py-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-5 h-5" />
                <span className="text-sm font-medium text-indigo-200">Regulatory Compliance</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Bank Verification Number (BVN) Verification</h2>
              <p className="text-indigo-100 text-sm leading-relaxed">
                In accordance with CBN regulations and the Money Laundering (Prevention and Prohibition) Act, 
                all financial service customers are required to provide valid identification. Your BVN helps us verify 
                your identity securely and maintain compliance with Nigerian financial regulations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Shield className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">Bank-Grade Security</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Building2 className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">CBN Regulated</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <BadgeCheck className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">NIBSS Verified</p>
          </div>
        </div>

        {/* Main Verification Card */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-8">
            {!verificationResult?.status ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Verify Your Identity</h3>
                  <p className="text-slate-500 text-sm">
                    Enter your 11-digit Bank Verification Number
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
                    <Label htmlFor="bvn" className="text-sm font-semibold text-slate-700">
                      Bank Verification Number (BVN)
                    </Label>
                    <Input
                      id="bvn"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter your 11-digit BVN"
                      value={bvn}
                      onChange={(e) => setBvn(formatBVN(e.target.value))}
                      className="text-center text-2xl tracking-widest font-mono h-14 border-2 focus:border-indigo-500"
                      maxLength={11}
                      disabled={isVerifying}
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Test BVN: 22222222221</span>
                      <span>{bvn.length}/11 digits</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleVerify}
                    disabled={bvn.length !== 11 || isVerifying}
                    className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Verify BVN
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Verification Successful!</h3>
                <p className="text-slate-500 mb-6">Your identity has been verified</p>
                
                {verificationResult.data && (
                  <div className="bg-slate-50 rounded-xl p-6 text-left mb-6">
                    <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
                      Verified Information
                    </h4>
                    <div className="space-y-3">
                      {verificationResult.data.first_name && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">First Name</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.first_name}</span>
                        </div>
                      )}
                      {verificationResult.data.last_name && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Last Name</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.last_name}</span>
                        </div>
                      )}
                      {verificationResult.data.dob && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date of Birth</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.formatted_dob || verificationResult.data.dob}</span>
                        </div>
                      )}
                      {verificationResult.data.mobile && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone</span>
                          <span className="font-semibold text-slate-900">{verificationResult.data.mobile}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setBvn('');
                    setVerificationResult(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Verify Another BVN
                </Button>
              </div>
            )}

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
              <strong>Why do we need your BVN?</strong> The Central Bank of Nigeria (CBN) 
              requires all financial institutions to verify customer identities as part of Know Your 
              Customer (KYC) and Anti-Money Laundering (AML) compliance.
            </AlertDescription>
          </Alert>

          <div className="text-center text-xs text-slate-400 space-y-1">
            <p>Your data is encrypted and processed securely via NIBSS-approved channels.</p>
            <p>© {new Date().getFullYear()} NEM Insurance Plc. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BVNVerification;
