
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Footer from '../components/layout/Footer';
import { 
  FileText, 
  Shield, 
  Users, 
  ArrowDown, 
  CheckCircle,
  Building2,
  UserCheck,
  Car,
  Star,
  Award,
  TrendingUp,
  HeartHandshake
} from 'lucide-react';
// Logo is now served from public folder

const Index = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const scrollToForms = () => {
    const formsSection = document.getElementById('forms-section');
    if (formsSection) {
      formsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDashboard = () => {
    if (isAdmin()) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Bank-level security with end-to-end encryption and regulatory compliance.',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Digital Excellence',
      description: 'Streamlined processes that reduce processing time by up to 75%.',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: HeartHandshake,
      title: '24/7 Support',
      description: 'Dedicated support team available round the clock for your assistance.',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: Award,
      title: 'Industry Leader',
      description: 'Years of excellence in providing comprehensive insurance solutions.',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  const formCategories = [
    {
      icon: UserCheck,
      title: 'KYC Forms',
      description: 'Know Your Customer verification for individuals and corporations',
      forms: ['Individual KYC', 'Corporate KYC'],
      path: '/kyc',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Building2,
      title: 'CDD Forms',
      description: 'Customer Due Diligence for various business relationships',
      forms: ['Corporate CDD', 'Partners CDD', 'Agents CDD', 'Brokers CDD', 'Individual CDD'],
      path: '/cdd',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Car,
      title: 'Claims Forms',
      description: 'Submit insurance claims across multiple categories',
      forms: ['Motor Claims', 'Fire & Special Perils', 'Professional Indemnity', 'Public Liability', 'Burglary Claims', 'Money Insurance', '+ 6 more'],
      path: '/claims',
      gradient: 'from-red-500 to-rose-500'
    }
  ];

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-light to-primary-dark text-white">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-100">
          <div className="absolute inset-0" style={{
      backgroundColor: '#800020', // classic solid burgundy
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gold-light bg-clip-text text-transparent">
                NEM Forms
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">
                Your secure digital gateway for KYC verification, CDD compliance, and insurance claims processing.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-right">
              <Button 
                onClick={scrollToForms}
                size="lg" 
                className="bg-white text-primary hover:bg-gold hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-3"
              >
                Explore Our Forms
                <ArrowDown className="ml-2 h-5 w-5 animate-bounce-slow" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience streamlined digital form processing with enterprise-grade security and reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center group hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Categories Section */}
      <div id="forms-section" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Digital Forms
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access our comprehensive suite of digital forms designed to streamline your compliance and claims processing
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {formCategories.map((category, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white border-0 shadow-lg animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`h-2 bg-gradient-to-r ${category.gradient}`}></div>
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {category.forms.map((form, formIndex) => (
                      <div key={formIndex} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 font-medium">{form}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link to={category.path}>
                    <Button className={`w-full bg-gradient-to-r ${category.gradient} hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl text-white border-0`}>
                      Access {category.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">What Makes Us Number One</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Real-time metrics showcasing our commitment to reliability and excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in-up">
              <div className="text-4xl font-bold text-gold mb-2">₦33B</div>
              <div className="text-white/80">Gross Premium Income</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold text-gold mb-2">₦50B</div>
              <div className="text-white/80">Claims Paid (2015-2022)</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold text-gold mb-2">99.9%</div>
              <div className="text-white/80">Uptime Guarantee</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-bold text-gold mb-2">24/7</div>
              <div className="text-white/80">Customer Support</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
