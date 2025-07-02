
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  FileText, 
  Shield, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Building2,
  UserCheck,
  Car
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Your data is protected with enterprise-grade security and compliance standards.'
    },
    {
      icon: FileText,
      title: 'Comprehensive Forms',
      description: 'Complete KYC, CDD, and claims processing with our streamlined digital forms.'
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: 'Our team of insurance professionals is here to guide you through every step.'
    }
  ];

  const formCategories = [
    {
      icon: UserCheck,
      title: 'KYC Forms',
      description: 'Know Your Customer verification for individuals and corporations',
      forms: ['Individual KYC', 'Corporate KYC'],
      color: 'bg-blue-50 text-blue-700'
    },
    {
      icon: Building2,
      title: 'CDD Forms',
      description: 'Customer Due Diligence for various business relationships',
      forms: ['Corporate', 'Partners', 'Agents', 'Brokers', 'Individual'],
      color: 'bg-green-50 text-green-700'
    },
    {
      icon: Car,
      title: 'Claims Forms',
      description: 'Submit insurance claims across multiple categories',
      forms: ['Motor', 'Fire', 'Marine', 'Travel', 'Public Liability', 'Personal Accident', '+ 8 more'],
      color: 'bg-red-50 text-red-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              NEM Insurance Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100">
              Streamlined insurance onboarding, KYC, and claims processing
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to={user.role === 'admin' || user.role === 'compliance' || user.role === 'superAdmin' ? '/admin/dashboard' : '/dashboard'}>
                  <Button size="lg" variant="secondary" className="text-red-900">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/signup">
                    <Button size="lg" variant="secondary" className="text-red-900">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/auth/signin">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-900">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose NEM Insurance?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of insurance services with our digital-first approach
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-red-900" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Categories Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Available Services
            </h2>
            <p className="text-xl text-gray-600">
              Complete your insurance documentation with our comprehensive form library
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {formCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.forms.map((form, formIndex) => (
                      <div key={formIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{form}</span>
                      </div>
                    ))}
                  </div>
                  {!user && (
                    <div className="mt-4 pt-4 border-t">
                      <Link to="/auth/signup">
                        <Button variant="outline" className="w-full">
                          Sign up to access
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-yellow-100 mb-8">
            Join thousands of satisfied customers who trust NEM Insurance
          </p>
          {!user && (
            <Link to="/auth/signup">
              <Button size="lg" variant="secondary" className="bg-white text-yellow-600 hover:bg-gray-100">
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
