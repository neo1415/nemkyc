
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Building2, Users, UserCheck, Briefcase, FileText, AlertCircle, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

const CDDForms: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [showNaicomModal, setShowNaicomModal] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (path: string, id: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const cddTypes = [
    {
      id: 'corporate',
      title: 'Corporate CDD',
      description: 'Customer Due Diligence form for corporate entities',
      icon: Building2,
      path: '/cdd/corporate',
      color: 'bg-blue-100 text-blue-900',
      requirements: [
        'Certificate of incorporation',
        'Directors information',
        'Business registration details',
        'Bank account information'
      ]
    },
    {
      id: 'partners',
      title: 'Partners CDD',
      description: 'Customer Due Diligence form for partnership entities',
      icon: Users,
      path: '/cdd/partners',
      color: 'bg-green-100 text-green-900',
      requirements: [
        'Partnership agreement',
        'Partners information',
        'Business registration',
        'Tax clearance certificate'
      ]
    },
    {
      id: 'individual',
      title: 'Individual CDD',
      description: 'Customer Due Diligence form for individual clients',
      icon: UserCheck,
      path: '/cdd/individual',
      color: 'bg-purple-100 text-purple-900',
      requirements: [
        'Valid identification',
        'Proof of address',
        'Employment details',
        'Bank account information'
      ]
    },
    {
      id: 'agents',
      title: 'Agents CDD',
      description: 'Customer Due Diligence form for insurance agents',
      icon: Briefcase,
      path: '/cdd/agents',
      color: 'bg-orange-100 text-orange-900',
      requirements: [
        'NAICOM license',
        'Professional credentials',
        'Business registration',
        'Bank account details'
      ]
    },
    {
      id: 'brokers',
      title: 'Brokers CDD',
      description: 'Customer Due Diligence form for insurance brokers',
      icon: FileText,
      path: '/cdd/brokers',
      color: 'bg-red-100 text-red-900',
      requirements: [
        'Brokerage license',
        'Professional indemnity',
        'Company registration',
        'Financial statements'
      ]
    }
  ];

  const handleFormClick = (form: any) => {
    if (form.id === 'corporate' || form.id === 'partners') {
      setSelectedForm(form.id);
      setShowNaicomModal(true);
    } else {
      // Navigate directly for other forms
      window.location.href = form.path;
    }
  };

  const handleNaicomChoice = (isNaicom: boolean) => {
    if (selectedForm === 'corporate') {
      window.location.href = isNaicom ? '/cdd/naicom-corporate' : '/cdd/corporate';
    } else if (selectedForm === 'partners') {
      window.location.href = isNaicom ? '/cdd/naicom-partners' : '/cdd/partners';
    }
    setShowNaicomModal(false);
    setSelectedForm(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Customer Due Diligence (CDD) Forms</h1>
          <p className="text-lg text-gray-600">
            Complete your Customer Due Diligence verification to comply with regulatory requirements
          </p>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Important Note:</p>
                <p>All CDD forms must be completed accurately and all required documents must be uploaded. 
                False or incomplete information may result in rejection of your application.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cddTypes.map((cdd) => (
            <Card key={cdd.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleFormClick(cdd)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${cdd.color}`}>
                      <cdd.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cdd.title}</CardTitle>
                      <CardDescription className="text-sm">{cdd.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(cdd.path, cdd.id);
                    }}
                    className="bg-burgundy-600 hover:bg-burgundy-700 text-white border-burgundy-600 hover:border-burgundy-700 rounded-md px-3 py-1 text-xs flex items-center gap-1"
                    style={{ backgroundColor: '#800020', borderColor: '#800020' }}
                  >
                    {copiedStates[cdd.id] ? (
                      <>
                        <Check className="h-3 w-3" />
                        Link Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Required Documents:</h4>
                    <ul className="space-y-1">
                      {cdd.requirements.map((req, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button className="w-full">
                    Start {cdd.title}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Contact Information:</h3>
              <p>Email: compliance@neminsurance.com</p>
              <p>Phone: +234 1 448 9570</p>
              <p>Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Documentation Requirements:</h3>
              <p>• All documents must be clear and legible</p>
              <p>• File formats: PDF, JPG, PNG (max 3MB each)</p>
              <p>• Documents must be current and valid</p>
            </div>
          </div>
        </div>
      </div>

      {/* NAICOM Modal */}
      <Dialog open={showNaicomModal} onOpenChange={setShowNaicomModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">NAICOM Approval Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">
                Are you NAICOM approved for this type of business?
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleNaicomChoice(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Yes, I am NAICOM approved
              </Button>
              <Button 
                onClick={() => handleNaicomChoice(false)}
                variant="outline" 
                className="w-full"
              >
                No, I am not NAICOM approved
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>This information determines which form variant you need to complete.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CDDForms;
