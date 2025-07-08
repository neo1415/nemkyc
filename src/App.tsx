import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Layout from './components/layout/Layout';
import Index from './pages/Index';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import UserDashboard from './pages/dashboard/UserDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ClaimsForms from './pages/claims/ClaimsForms';
import MotorClaim from './pages/claims/MotorClaim';
import ProfessionalIndemnityClaimForm from './pages/claims/ProfessionalIndemnityClaimForm';
import RentAssuranceClaim from './pages/claims/RentAssuranceClaim';
import MoneyInsuranceClaim from './pages/claims/MoneyInsuranceClaim';
import PublicLiabilityClaimForm from './pages/claims/PublicLiabilityClaimForm';
import EmployersLiabilityClaim from './pages/claims/EmployersLiabilityClaim';
import KYCForms from './pages/kyc/KYCForms';
import IndividualKYC from './pages/kyc/IndividualKYC';
import CorporateKYC from './pages/kyc/CorporateKYC';
import CDDForms from './pages/cdd/CDDForms';
import CorporateCDD from './pages/cdd/CorporateCDD';
import NaicomCorporateCDD from './pages/cdd/NaicomCorporateCDD';
import PartnersCDD from './pages/cdd/PartnersCDD';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CombinedGPAEmployersLiabilityClaim from './pages/claims/CombinedGPAEmployersLiabilityClaim';
import BurglaryClaimForm from './pages/claims/BurglaryClaimForm';
import GroupPersonalAccidentClaim from './pages/claims/GroupPersonalAccidentClaim';
import FireSpecialPerilsClaim from './pages/claims/FireSpecialPerilsClaim';
import GoodsInTransitClaim from './pages/claims/GoodsInTransitClaim';
import ContractorsPlantMachineryClaim from './pages/claims/ContractorsPlantMachineryClaim';
import AllRiskClaim from './pages/claims/AllRiskClaim';
import NaicomPartnersCDD from './pages/cdd/NaicomPartnersCDD';

function App() {
  return (
   <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          
          {/* Auth routes with /auth prefix */}
          <Route path="auth/signin" element={<SignIn />} />
          <Route path="auth/signup" element={<SignUp />} />
          
          {/* Claims Routes */}
          <Route path="/claims" element={<ClaimsForms />} />
          <Route path="/claims/motor" element={<MotorClaim />} />
          <Route path="/claims/professional-indemnity" element={<ProfessionalIndemnityClaimForm />} />
          <Route path="/claims/public-liability" element={<PublicLiabilityClaimForm />} />
          <Route path="/claims/employers-liability" element={<EmployersLiabilityClaim />} />
          <Route path="/claims/combined-gpa-employers-liability" element={<CombinedGPAEmployersLiabilityClaim />} />
          <Route path="/claims/burglary" element={<BurglaryClaimForm />} />
          <Route path="/claims/group-personal-accident" element={<GroupPersonalAccidentClaim />} />
          <Route path="/claims/fire-special-perils" element={<FireSpecialPerilsClaim />} />
          <Route path="/claims/rent-assurance" element={<RentAssuranceClaim />} />
          <Route path="/claims/money-insurance" element={<MoneyInsuranceClaim />} />
          <Route path="/claims/goods-in-transit" element={<GoodsInTransitClaim />} />
          <Route path="/claims/contractors-plant-machinery" element={<ContractorsPlantMachineryClaim />} />
          <Route path="/claims/all-risk" element={<AllRiskClaim />} />
          
          {/* KYC Routes - accessible without authentication */}
          <Route path="kyc" element={<KYCForms />} />
          <Route path="kyc/individual" element={<IndividualKYC />} />
          <Route path="kyc/corporate" element={<CorporateKYC />} />
          
          {/* CDD Routes - accessible without authentication */}
          <Route path="cdd" element={<CDDForms />} />
          <Route path="cdd/corporate" element={<CorporateCDD />} />
          <Route path="cdd/naicom-corporate" element={<NaicomCorporateCDD />} />
          <Route path="cdd/partners" element={<PartnersCDD />} />
          <Route path="cdd/naicom-partners" element={<NaicomPartnersCDD />} />
          
          {/* Protected Routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
   </AuthProvider>
  );
}

export default App;
