
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Car, Shield, Users, Building, ArrowRight, UserCheck, Home, DollarSign, FileText, AlertTriangle, Flame, Truck, Wrench, AlertCircle, Copy, Check } from 'lucide-react';

const ClaimsForms: React.FC = () => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (path: string, title: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedStates(prev => ({ ...prev, [title]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [title]: false }));
      }, 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  const claimForms = [
    {
      title: 'Motor Claim',
      description: 'Submit a claim for vehicle damage, accidents, or theft',
      icon: <Car className="h-8 w-8 text-red-600" />,
      path: '/claims/motor',
      features: ['Vehicle damage assessment', 'Third-party liability', 'Police report filing']
    },
    {
      title: 'Professional Indemnity Claim',
      description: 'Professional liability and errors & omissions claims',
      icon: <Shield className="h-8 w-8 text-red-600" />,
      path: '/claims/professional-indemnity',
      features: ['Professional liability', 'Contract disputes', 'Client claims']
    },
    {
      title: 'Public Liability Claim',
      description: 'Claims for public accidents and third-party injuries',
      icon: <Users className="h-8 w-8 text-red-600" />,
      path: '/claims/public-liability',
      features: ['Public accidents', 'Property damage', 'Personal injury']
    },
    {
      title: 'Employers Liability Claim',
      description: 'Employee injury and workplace accident claims',
      icon: <Building className="h-8 w-8 text-red-600" />,
      path: '/claims/employers-liability',
      features: ['Workplace injuries', 'Employee accidents', 'Compensation claims']
    },
    {
      title: 'Combined GPA & Employers Liability Claim',
      description: 'Combined General Personal Accident and Employers Liability claims',
      icon: <UserCheck className="h-8 w-8 text-red-600" />,
      path: '/claims/combined-gpa-employers-liability',
      features: ['Combined coverage', 'Personal accidents', 'Employer responsibilities']
    },
    {
      title: 'Burglary, Housebreaking and Larceny Claim',
      description: 'Claims for burglary, housebreaking, and theft incidents',
      icon: <Home className="h-8 w-8 text-red-600" />,
      path: '/claims/burglary',
      features: ['Property theft', 'Burglary incidents', 'Security breaches']
    },
    {
      title: 'Group Personal Accident Claim',
      description: 'Submit claims for group personal accident insurance',
      icon: <Users className="h-8 w-8 text-red-600" />,
      path: '/claims/group-personal-accident',
      features: ['Group accidents', 'Personal injury', 'Medical expenses']
    },
    {
      title: 'Fire and Special Perils Claim',
      description: 'Claims for fire damage and special perils coverage',
      icon: <Flame className="h-8 w-8 text-red-600" />,
      path: '/claims/fire-special-perils',
      features: ['Fire damage', 'Special perils', 'Property coverage']
    },
    {
      title: 'Rent Assurance Policy Claim',
      description: 'Submit claims for rent assurance policy coverage',
      icon: <Building className="h-8 w-8 text-red-600" />,
      path: '/claims/rent-assurance',
      features: ['Rent defaults', 'Tenant protection', 'Landlord coverage']
    },
    {
      title: 'Money Insurance Claim',
      description: 'Claims for money insurance coverage and cash-in-transit',
      icon: <DollarSign className="h-8 w-8 text-red-600" />,
      path: '/claims/money-insurance',
      features: ['Cash-in-transit', 'Safe robbery', 'Money loss']
    },
    {
      title: 'Goods-in-Transit Insurance Claim',
      description: 'Submit claims for goods damaged or lost during transit',
      icon: <Truck className="h-8 w-8 text-red-600" />,
      path: '/claims/goods-in-transit',
      features: ['Transit damage', 'Cargo loss', 'Transportation risks']
    },
    {
      title: 'Contractors, Plant and Machinery Claim',
      description: 'Claims for contractors equipment and machinery damage',
      icon: <Wrench className="h-8 w-8 text-red-600" />,
      path: '/claims/contractors-plant-machinery',
      features: ['Equipment damage', 'Machinery theft', 'Construction risks']
    },
    {
      title: 'All Risk Insurance Claim',
      description: 'Comprehensive all-risk insurance coverage claims',
      icon: <Shield className="h-8 w-8 text-red-600" />,
      path: '/claims/all-risk',
      features: ['Comprehensive coverage', 'Property protection', 'Multiple perils']
    },
    {
      title: 'Fidelity Guarantee Claim',
      description: 'Claims for employee dishonesty and fidelity coverage',
      icon: <FileText className="h-8 w-8 text-red-600" />,
      path: '/claims/fidelity-guarantee',
      features: ['Employee dishonesty', 'Fraud protection', 'Financial loss coverage']
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Claims Forms</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Submit your insurance claims quickly and securely. Choose the appropriate form type below to get started.
          </p>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Important Note:</p>
                <p>All claims forms must be completed accurately and all required documents must be uploaded. 
                False or incomplete information may result in rejection of your application.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {claimForms.map((form, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                      {form.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{form.title}</CardTitle>
                      <CardDescription className="mt-2">{form.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(form.path, form.title)}
                    className="bg-burgundy-600 hover:bg-burgundy-700 text-white hover:text-yellow-400 border-burgundy-600 hover:border-burgundy-700 rounded-md px-3 py-1 text-xs flex items-center gap-1 flex-shrink-0"
                    style={{ backgroundColor: '#800020', borderColor: '#800020' }}
                  >
                    {copiedStates[form.title] ? (
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
                <ul className="space-y-2 mb-6">
                  {form.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full group">
                  <Link to={form.path}>
                    Start Claim Form
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-6">
              If you're unsure which form to use or need assistance with your claim, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                Contact Support
              </Button>
              <Button variant="outline">
                Download Forms (PDF)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimsForms;
