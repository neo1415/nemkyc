
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Car, 
  Shield, 
  Users, 
  DollarSign, 
  FileText, 
  Truck, 
  Briefcase,
  Building,
  Flame,
  UserCheck,
  Settings,
  Heart,
  Package
} from 'lucide-react';

const ClaimsForms: React.FC = () => {
  const claimTypes = [
    {
      id: 'motor',
      title: 'Motor Insurance Claim',
      description: 'Submit claims for vehicle accidents, damage, or theft',
      icon: <Car className="h-8 w-8" />,
      path: '/claims/motor',
      color: 'bg-blue-500'
    },
    {
      id: 'professional-indemnity',
      title: 'Professional Indemnity Claim',
      description: 'Submit claims for professional liability and negligence',
      icon: <Briefcase className="h-8 w-8" />,
      path: '/claims/professional-indemnity',
      color: 'bg-purple-500'
    },
    {
      id: 'public-liability',
      title: 'Public Liability Claim',
      description: 'Submit claims for public liability incidents',
      icon: <Users className="h-8 w-8" />,
      path: '/claims/public-liability',
      color: 'bg-green-500'
    },
    {
      id: 'money',
      title: 'Money Insurance Claim',
      description: 'Submit claims for money losses in transit or storage',
      icon: <DollarSign className="h-8 w-8" />,
      path: '/claims/money',
      color: 'bg-yellow-500',
      disabled: true
    },
    {
      id: 'burglary',
      title: 'Burglary & Housebreaking Claim',
      description: 'Submit claims for burglary, housebreaking, and larceny',
      icon: <Shield className="h-8 w-8" />,
      path: '/claims/burglary',
      color: 'bg-red-500',
      disabled: true
    },
    {
      id: 'fire',
      title: 'Fire & Special Perils Claim',
      description: 'Submit claims for fire damage and special perils',
      icon: <Flame className="h-8 w-8" />,
      path: '/claims/fire',
      color: 'bg-orange-500',
      disabled: true
    },
    {
      id: 'goods-in-transit',
      title: 'Goods-in-Transit Claim',
      description: 'Submit claims for goods damaged or lost during transit',
      icon: <Truck className="h-8 w-8" />,
      path: '/claims/goods-in-transit',
      color: 'bg-indigo-500',
      disabled: true
    },
    {
      id: 'contractors',
      title: 'Contractors Plant & Machinery Claim',
      description: 'Submit claims for contractor equipment and machinery',
      icon: <Settings className="h-8 w-8" />,
      path: '/claims/contractors',
      color: 'bg-gray-500',
      disabled: true
    },
    {
      id: 'personal-accident',
      title: 'Personal Accident Claim',
      description: 'Submit claims for personal accident insurance',
      icon: <Heart className="h-8 w-8" />,
      path: '/claims/personal-accident',
      color: 'bg-pink-500',
      disabled: true
    },
    {
      id: 'employers-liability',
      title: 'Employers Liability Claim',
      description: 'Submit claims for workplace accidents and injuries',
      icon: <Building className="h-8 w-8" />,
      path: '/claims/employers-liability',
      color: 'bg-teal-500',
      disabled: true
    },
    {
      id: 'group-personal-accident',
      title: 'Group Personal Accident Claim',
      description: 'Submit claims for group personal accident coverage',
      icon: <Users className="h-8 w-8" />,
      path: '/claims/group-personal-accident',
      color: 'bg-cyan-500',
      disabled: true
    },
    {
      id: 'fidelity-guarantee',
      title: 'Fidelity Guarantee Claim',
      description: 'Submit claims for employee dishonesty and fraud',
      icon: <UserCheck className="h-8 w-8" />,
      path: '/claims/fidelity-guarantee',
      color: 'bg-emerald-500',
      disabled: true
    },
    {
      id: 'all-risk',
      title: 'All Risk Claim',
      description: 'Submit claims for all risk insurance coverage',
      icon: <Package className="h-8 w-8" />,
      path: '/claims/all-risk',
      color: 'bg-violet-500',
      disabled: true
    },
    {
      id: 'rent-assurance',
      title: 'Rent Assurance Policy Claim',
      description: 'Submit claims for rent default and assurance',
      icon: <FileText className="h-8 w-8" />,
      path: '/claims/rent-assurance',
      color: 'bg-rose-500',
      disabled: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Insurance Claims</h1>
          <p className="text-xl text-gray-600">
            Select the type of insurance claim you would like to submit. 
            Each form is designed to collect all necessary information for processing your claim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claimTypes.map((claim) => (
            <Card key={claim.id} className={`hover:shadow-lg transition-shadow ${claim.disabled ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-4">
                <div className={`${claim.color} text-white p-3 rounded-lg w-fit mb-3`}>
                  {claim.icon}
                </div>
                <CardTitle className="text-xl">{claim.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  {claim.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {claim.disabled ? (
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                ) : (
                  <Link to={claim.path}>
                    <Button className="w-full">
                      Start Claim
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Claims Support</h3>
              <p className="text-gray-600 mb-2">
                For assistance with your claim submission or questions about required documents:
              </p>
              <p className="font-medium text-blue-600">Phone: 01 448 9570</p>
              <p className="font-medium text-blue-600">Email: claims@neminsurance.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What You'll Need</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Policy number and documents</li>
                <li>• Incident details and dates</li>
                <li>• Supporting documents (photos, reports)</li>
                <li>• Contact information for all parties</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimsForms;
