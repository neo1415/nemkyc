import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import logoImage from '../../NEMLogo (2)_page-0001.jpg';

const Footer: React.FC = () => {
  return (
    <footer className="bg-footer-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
               <img 
                 src={logoImage} 
                 alt="NEM Insurance" 
                 className="h-10 w-10 object-contain rounded bg-white p-1"
               />
              <span className="text-xl font-bold">NEM Insurance</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Nigeria's leading insurance company providing comprehensive coverage and exceptional service since inception.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-gold flex-shrink-0" />
                <div>
                  <p className="font-medium">Office Address</p>
                  <p className="text-primary-foreground/80">
                    NEM Insurance Plc<br />
                    199, Ikorodu Road, Obanikoro<br />
                    Lagos, Nigeria
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gold" />
                <div>
                  <p>234-02-014489560</p>
                  <p>234-02-014489570</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gold" />
                <a 
                  href="mailto:nemsupport@nem-insurance.com" 
                  className="hover:text-gold transition-colors"
                >
                  nemsupport@nem-insurance.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gold" />
                <div>
                  <p className="font-medium">For Claims call</p>
                  <a 
                    href="tel:+2348117935563" 
                    className="text-gold hover:text-gold/80 transition-colors"
                  >
                    +234-8117935563
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gold" />
                <div>
                  <p className="font-medium">For Underwriting call</p>
                  <a 
                    href="tel:+2348077284631" 
                    className="text-gold hover:text-gold/80 transition-colors"
                  >
                    +234-8077284631
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal & Compliance</h3>
            <div className="space-y-2 text-sm">
              <a 
                href="https://nem-insurance.com/Data-Privacy-Policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-primary-foreground/80 hover:text-gold transition-colors"
              >
                Data Privacy Policy
              </a>
              <p className="text-primary-foreground/60 text-xs leading-relaxed">
                Authorised & Regulated by the National Insurance Commission RIC047
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-primary-foreground/60 text-sm">
              © 2025 NEM Insurance PLC. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-primary-foreground/80 hover:text-gold transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-primary-foreground/80 hover:text-gold transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-primary-foreground/80 hover:text-gold transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;