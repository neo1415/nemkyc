
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
      <header className="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="hero-grid">
            {/* Left Column - Content */}
            <div className="hero__content animate-slide-in-left">
              <h1 className="hero__title">
                NEM Forms
              </h1>
              <p className="hero__subtitle">
                Your secure digital gateway for KYC verification, CDD compliance, and insurance claims processing.
              </p>
              
              <button 
                onClick={scrollToForms}
                className="hero__cta"
                aria-label="Explore Our Forms"
              >
                Explore Our Forms
              </button>
              
              {/* Features Grid */}
              <div className="hero__features">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="feature-card animate-fade-in-up"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
              
              {/* Social Section */}
              <div className="social-section animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <span className="social-text">Reach out anytime</span>
                <div className="social-icons">
                  <a href="#" className="social-icon" aria-label="Facebook">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-icon" aria-label="Instagram">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-icon" aria-label="Twitter">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-icon" aria-label="LinkedIn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Right Column - Hero Image */}
            <div className="hero__image-container animate-slide-in-right">
              <img 
                src="/src/hero.jpg" 
                alt="NEM Forms hero"
                className="hero__image"
              />
            </div>
          </div>
        </div>
      </header>

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
