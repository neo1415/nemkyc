
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Car, 
  DollarSign, 
  Shield, 
  Plane, 
  Users, 
  Activity, 
  User, 
  Flame, 
  Ship, 
  FileText, 
  Home, 
  Truck, 
  Heart 
} from 'lucide-react';

const ClaimsForms: React.FC = () => {
  const claimsTypes = [
    {
      id: 'motor',
      title: 'Motor Claim',
      description: 'Vehicle accident and damage claims',
      icon: Car,
      path: '/claims/motor'
    },
    {
      id: 'money',
      title: 'Money Claim',
      description: 'Cash and money insurance claims',
      icon: DollarSign,
      path: '/claims/money'
    },
    {
      id: 'burglary',
      title: 'Burglary Claim',
      description: 'Theft and burglary insurance claims',
      icon: Shield,
      path: '/claims/burglary'
    },
    {
      id: 'travel',
      title: 'Travel Claim',
      description: 'Travel insurance claims',
      icon: Plane,
      path: '/claims/travel'
    },
    {
      id: 'public-liability',
      title: 'Public Liability',
      description: 'Public liability insurance claims',
      icon: Users,
      path: '/claims/public-liability'
    },
    {
      id: 'combined-gpa',
      title: 'Combined GPA',
      description: 'Group Personal Accident claims',
      icon: Activity,
      path: '/claims/combined-gpa'
    },
    {
      id: 'personal-accident',
      title: 'Personal Accident',
      description: 'Personal accident insurance claims',
      icon: User,
      path: '/claims/personal-accident'
    },
    {
      id: 'fire',
      title: 'Fire Claim',
      description: 'Fire damage insurance claims',
      icon: Flame,
      path: '/claims/fire'
    },
    {
      id: 'marine',
      title: 'Marine Claim',
      description: 'Marine and cargo insurance claims',
      icon: Ship,
      path: '/claims/marine'
    },
    {
      id: 'professional-indemnity',
      title: 'Professional Indemnity',
      description: 'Professional liability claims',
      icon: FileText,
      path: '/claims/professional-indemnity'
    },
    {
      id: 'houseowners',
      title: 'Houseowners',
      description: 'Homeowner insurance claims',
      icon: Home,
      path: '/claims/houseowners'
    },
    {
      id: 'householders',
      title: 'Householders',
      description: 'Household contents claims',
      icon: Home,
      path: '/claims/householders'
    },
    {
      id: 'goods-in-transit',
      title: 'Goods in Transit',
      description: 'Transit insurance claims',
      icon: Truck,
      path: '/claims/goods-in-transit'
    },
    {
      id: 'group-life',
      title: 'Group Life',
      description: 'Group life insurance claims',
      icon: Heart,
      path: '/claims/group-life'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Insurance Claims</h1>
          <p className="text-lg text-gray-600">
            Submit your insurance claim with detailed information and supporting documents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claimsTypes.map((claim) => (
            <Card key={claim.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <claim.icon className="h-6 w-6 text-red-900" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{claim.title}</CardTitle>
                    <CardDescription>{claim.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to={claim.path}>
                  <Button className="w-full">
                    File Claim
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClaimsForms;
