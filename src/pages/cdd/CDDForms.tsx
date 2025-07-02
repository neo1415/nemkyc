
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Building2, Users, UserCheck, Briefcase, User } from 'lucide-react';

interface CDDType {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  naicomPath?: string;
  hasNaicom: boolean;
}

const CDDForms: React.FC = () => {
  const [selectedCDD, setSelectedCDD] = useState<CDDType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cddTypes: CDDType[] = [
    {
      id: 'corporate',
      title: 'Corporate CDD',
      description: 'Customer Due Diligence for corporate entities',
      icon: Building2,
      path: '/cdd/corporate',
      naicomPath: '/cdd/naicom-corporate',
      hasNaicom: true
    },
    {
      id: 'partners',
      title: 'Partners CDD',
      description: 'Customer Due Diligence for business partners',
      icon: Users,
      path: '/cdd/partners',
      naicomPath: '/cdd/naicom-partners',
      hasNaicom: true
    },
    {
      id: 'agents',
      title: 'Agents CDD',
      description: 'Customer Due Diligence for insurance agents',
      icon: UserCheck,
      path: '/cdd/agents',
      hasNaicom: false
    },
    {
      id: 'brokers',
      title: 'Brokers CDD',
      description: 'Customer Due Diligence for insurance brokers',
      icon: Briefcase,
      path: '/cdd/brokers',
      hasNaicom: false
    },
    {
      id: 'individual',
      title: 'Individual CDD',
      description: 'Customer Due Diligence for individual clients',
      icon: User,
      path: '/cdd/individual',
      hasNaicom: false
    }
  ];

  const handleCDDClick = (cdd: CDDType) => {
    if (cdd.hasNaicom) {
      setSelectedCDD(cdd);
      setIsModalOpen(true);
    } else {
      window.location.href = cdd.path;
    }
  };

  const handleNaicomResponse = (isNaicomApproved: boolean) => {
    if (selectedCDD) {
      const cdd = cddTypes.find(c => c.id === selectedCDD.id);
      if (cdd) {
        window.location.href = isNaicomApproved ? (cdd.naicomPath || cdd.path) : cdd.path;
      }
    }
    setIsModalOpen(false);
    setSelectedCDD(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">CDD Forms</h1>
          <p className="text-lg text-gray-600">
            Complete Customer Due Diligence forms for compliance verification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cddTypes.map((cdd) => (
            <Card key={cdd.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <cdd.icon className="h-6 w-6 text-red-900" />
                  </div>
                  <div>
                    <CardTitle>{cdd.title}</CardTitle>
                    <CardDescription>{cdd.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleCDDClick(cdd)}
                >
                  Start {cdd.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>NAICOM Approval Status</DialogTitle>
              <DialogDescription>
                Are you NAICOM approved for {selectedCDD?.title}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="space-x-2">
              <Button
                variant="outline"
                onClick={() => handleNaicomResponse(false)}
              >
                No
              </Button>
              <Button
                onClick={() => handleNaicomResponse(true)}
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CDDForms;
