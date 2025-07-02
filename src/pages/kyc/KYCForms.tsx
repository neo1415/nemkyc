
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { User, Building2, FileText } from 'lucide-react';

const KYCForms: React.FC = () => {
  const kycTypes = [
    {
      id: 'individual',
      title: 'Individual KYC',
      description: 'Know Your Customer form for individual applicants',
      icon: User,
      path: '/kyc/individual',
      requirements: [
        'Valid government ID',
        'Proof of address',
        'Passport photograph',
        'Employment details'
      ]
    },
    {
      id: 'corporate',
      title: 'Corporate KYC',
      description: 'Know Your Customer form for corporate entities',
      icon: Building2,
      path: '/kyc/corporate',
      requirements: [
        'Certificate of incorporation',
        'Memorandum of association',
        'Directors information',
        'Financial statements'
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">KYC Forms</h1>
          <p className="text-lg text-gray-600">
            Complete your Know Your Customer verification to access our insurance services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kycTypes.map((kyc) => (
            <Card key={kyc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <kyc.icon className="h-6 w-6 text-red-900" />
                  </div>
                  <div>
                    <CardTitle>{kyc.title}</CardTitle>
                    <CardDescription>{kyc.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Required Documents:</h4>
                    <ul className="space-y-1">
                      {kyc.requirements.map((req, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link to={kyc.path}>
                    <Button className="w-full">
                      Start {kyc.title}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KYCForms;
