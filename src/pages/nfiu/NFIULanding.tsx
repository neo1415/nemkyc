import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const NFIULanding: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">NFIU Forms</h1>
          <p className="text-muted-foreground">
            Nigerian Financial Intelligence Unit Regulatory Reporting
          </p>
        </div>

        {/* Information Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About NFIU Forms</AlertTitle>
          <AlertDescription>
            NFIU forms are for regulatory reporting to the Nigerian Financial Intelligence Unit. 
            Complete these forms for compliance purposes. These forms include additional fields 
            required by NFIU regulations, including BVN and account details.
          </AlertDescription>
        </Alert>

        {/* Form Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Individual NFIU Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                <CardTitle>Individual NFIU</CardTitle>
              </div>
              <CardDescription>
                For individual customers and personal insurance policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="font-semibold">Required Information:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Personal identification (NIN)</li>
                  <li>Bank Verification Number (BVN)</li>
                  <li>Tax Identification Number</li>
                  <li>Source of income details</li>
                  <li>Identity document upload</li>
                </ul>
              </div>
              <Link to="/nfiu/individual">
                <Button className="w-full">
                  Start Individual NFIU Form
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Corporate NFIU Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-primary" />
                <CardTitle>Corporate NFIU</CardTitle>
              </div>
              <CardDescription>
                For corporate entities and business insurance policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="font-semibold">Required Information:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Company registration details (CAC)</li>
                  <li>Director/Signatory information with BVN</li>
                  <li>Company Tax Identification Number</li>
                  <li>Bank account details (Naira & Domiciliary)</li>
                  <li>CAC document upload</li>
                </ul>
              </div>
              <Link to="/nfiu/corporate">
                <Button className="w-full">
                  Start Corporate NFIU Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">What's the difference between NFIU and KYC forms?</h3>
              <p className="text-sm text-muted-foreground">
                <strong>NFIU Forms:</strong> Required for regulatory reporting to the Nigerian Financial Intelligence Unit. 
                These forms include additional compliance fields such as BVN, Tax ID (mandatory), and detailed account information.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>KYC Forms:</strong> Used for customer onboarding and verification to establish a business relationship. 
                These forms focus on identity verification and basic customer information.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Which form should I complete?</h3>
              <p className="text-sm text-muted-foreground">
                If you're unsure which form to complete, please contact your insurance agent or our customer service team for guidance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NFIULanding;
