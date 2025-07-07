
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Car, Shield, Users, Building, ArrowRight, UserCheck } from 'lucide-react';

const ClaimsForms: React.FC = () => {
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {claimForms.map((form, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                    {form.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{form.title}</CardTitle>
                    <CardDescription className="mt-2">{form.description}</CardDescription>
                  </div>
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
