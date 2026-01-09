import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { 
  Settings, 
  Key, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '../../assets/NEMs-Logo.jpg';

const DemoConfig: React.FC = () => {
  const navigate = useNavigate();
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if already configured
    const savedKey = localStorage.getItem('paystack_secret_key');
    if (savedKey) {
      setSecretKey(savedKey);
      setIsConfigured(true);
    }
  }, []);

  const handleSaveConfig = () => {
    if (!secretKey.trim()) {
      toast.error('Please enter your Paystack Secret Key');
      return;
    }

    if (!secretKey.startsWith('sk_')) {
      toast.error('Invalid key format. Paystack secret keys start with "sk_"');
      return;
    }

    localStorage.setItem('paystack_secret_key', secretKey);
    setIsConfigured(true);
    toast.success('API configuration saved successfully!');
  };

  const handleClearConfig = () => {
    localStorage.removeItem('paystack_secret_key');
    setSecretKey('');
    setIsConfigured(false);
    toast.info('API configuration cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="NEM Insurance" className="w-10 h-10 rounded-lg shadow-sm" />
            <div>
              <h1 className="font-semibold text-slate-900">Identity Verification Demo</h1>
              <p className="text-xs text-slate-500">API Configuration</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Settings className="w-3 h-3 mr-1" />
            Demo Mode
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This demo uses Paystack's Identity Verification API to validate NIN and CAC numbers. 
            Configure your API keys below to test the verification flow.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Configuration Card */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                Paystack API Configuration
              </CardTitle>
              <CardDescription>
                Enter your Paystack secret key to enable identity verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-sm font-medium">
                  Secret Key
                </Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showKey ? 'text' : 'password'}
                    placeholder="Enter your Paystack secret key"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Use your test key (sk_test_...) for demo purposes
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveConfig} className="flex-1">
                  <Shield className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
                {isConfigured && (
                  <Button variant="outline" onClick={handleClearConfig}>
                    Clear
                  </Button>
                )}
              </div>

              {isConfigured && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    API configured successfully. You can now test verification.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <a
                  href="https://dashboard.paystack.com/#/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Get your API keys from Paystack Dashboard
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-indigo-600" />
                Test Verification Pages
              </CardTitle>
              <CardDescription>
                Once configured, test the verification experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => navigate('/demo/verify/nin')}
                disabled={!isConfigured}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  isConfigured 
                    ? 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer' 
                    : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">BVN Verification</h3>
                    <p className="text-sm text-slate-500">For individual customers</p>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700">Individual</Badge>
                </div>
              </button>

              <button
                onClick={() => navigate('/demo/verify/cac')}
                disabled={!isConfigured}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  isConfigured 
                    ? 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer' 
                    : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">CAC Verification</h3>
                    <p className="text-sm text-slate-500">For corporate customers</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">Corporate</Badge>
                </div>
              </button>

              {!isConfigured && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Configure your API key first to access verification pages
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="mt-8 shadow-lg border-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Security Notice</h3>
                <p className="text-sm text-slate-300">
                  This is a demo environment. API keys are stored locally in your browser and are never 
                  transmitted to our servers. In production, all API calls will be routed through secure 
                  backend services with proper encryption and audit logging.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DemoConfig;
