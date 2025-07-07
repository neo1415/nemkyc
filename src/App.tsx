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

function App() {
  return (
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
          
          {/* KYC Routes - accessible without authentication */}
          <Route path="kyc" element={<KYCForms />} />
          <Route path="kyc/individual" element={<IndividualKYC />} />
          <Route path="kyc/corporate" element={<CorporateKYC />} />
          
          {/* CDD Routes - accessible without authentication */}
          <Route path="cdd" element={<CDDForms />} />
          <Route path="cdd/corporate" element={<CorporateCDD />} />
          <Route path="cdd/naicom-corporate" element={<NaicomCorporateCDD />} />
          <Route path="cdd/partners" element={<PartnersCDD />} />
          
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
  );
}

export default App;
