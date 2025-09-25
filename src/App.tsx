import React, { useEffect } from 'react';
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
import IndividualCDD from './pages/cdd/IndividualCDD';
import AgentsCDD from './pages/cdd/AgentsCDD';
import BrokersCDD from './pages/cdd/BrokersCDD';
import FidelityGuaranteeClaim from './pages/claims/FidelityGuaranteeClaim';
import AdminClaimsTable from './pages/admin/AdminClaimsTable';
import AdminCDDTable from './pages/admin/AdminCDDTable';
import AdminKYCTable from './pages/admin/AdminKYCTable';
import AdminUsersTable from './pages/admin/AdminUsersTable';
import FormViewer from './pages/admin/FormViewer';
import EventsLogPage from './pages/admin/EventsLogPage';
import AdminMotorClaimsTable from './pages/admin/AdminMotorClaimsTable';

import AdminAgentsCDDTable from './pages/admin/AdminAgentsCDDTable';
import AdminIndividualCDDTable from './pages/admin/AdminIndividualCDDTable';
import AdminRentAssuranceClaimsTable from './pages/admin/AdminRentAssuranceClaimsTable';
import AdminMoneyInsuranceClaimsTable from './pages/admin/AdminMoneyInsuranceClaimsTable';
import AdminBurglaryClaimsTable from './pages/admin/AdminBurglaryClaimsTable';
import AdminContractorsPlantMachineryClaimsTable from './pages/admin/AdminContractorsPlantMachineryClaimsTable';
import AdminFidelityGuaranteeClaimsTable from './pages/admin/AdminFidelityGuaranteeClaimsTable';
import AdminFireSpecialPerilsClaimsTable from './pages/admin/AdminFireSpecialPerilsClaimsTable';
import AdminEmployersLiabilityClaimsTable from './pages/admin/AdminEmployersLiabilityClaimsTable';
import AdminAllRiskClaimsTable from './pages/admin/AdminAllRiskClaimsTable';
import AdminProfessionalIndemnityClaimsTable from './pages/admin/AdminProfessionalIndemnityClaimsTable';
import AdminPublicLiabilityClaimsTable from './pages/admin/AdminPublicLiabilityClaimsTable';
import AdminCombinedGPAEmployersLiabilityClaimsTable from './pages/admin/AdminCombinedGPAEmployersLiabilityClaimsTable';
import AdminGroupPersonalAccidentClaimsTable from './pages/admin/AdminGroupPersonalAccidentClaimsTable';
import AdminGoodsInTransitClaimsTable from './pages/admin/AdminGoodsInTransitClaimsTable';
import AdminIndividualKYCTable from './pages/admin/AdminIndividualKYCTable';
import AdminCorporateKYCTable from './pages/admin/AdminCorporateKYCTable';
import AdminCorporateCDDTable from './pages/admin/AdminCorporateCDDTable';
import AdminPartnersCDDTable from './pages/admin/AdminPartnersCDDTable';
import AdminBrokersCDDTable from './pages/admin/AdminBrokersCDDTable';
import AdminProfile from './pages/admin/AdminProfile';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import CorporateCDDViewer from './pages/admin/CorporateCDDViewer';
import PartnersCDDViewer from './pages/admin/PartnersCDDViewer';
import MFAEnrollment from './components/auth/MFAEnrollment';
import MFAVerification from './components/auth/MFAVerification';
import MFAHelper from './components/auth/MFAHelper';


function App() {
  useEffect(() => {
    // Global error handler for unhandled promise rejections and errors
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      // Silently handle Lottie animation errors that don't affect functionality
      if (event instanceof ErrorEvent && event.message?.includes('lottie')) {
        console.warn('Lottie animation error suppressed:', event.message);
        event.preventDefault();
        return;
      }
      if ('reason' in event && event.reason?.message?.includes('lottie')) {
        console.warn('Lottie promise rejection suppressed:', event.reason);
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <MFAHelper>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
              
              {/* Auth routes with /auth prefix */}
              <Route path="auth/signin" element={<SignIn />} />
              <Route path="auth/signup" element={<SignUp />} />
              
              {/* MFA Routes */}
              <Route path="auth/mfa/enroll" element={<MFAEnrollment />} />
              <Route path="auth/mfa/verify" element={<MFAVerification />} />
             
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
             <Route path="/claims/fidelity-guarantee" element={<FidelityGuaranteeClaim />} />
             
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
             <Route path="cdd/individual" element={<IndividualCDD />} />
             <Route path="cdd/agents" element={<AgentsCDD />} />
             <Route path="cdd/brokers" element={<BrokersCDD />} />
             
             {/* Protected Routes */}
             <Route path="dashboard" element={
               <ProtectedRoute>
                 <UserDashboard />
               </ProtectedRoute>
             } />
             
              <Route path="admin" element={
                <RoleProtectedRoute allowedRoles={['admin', 'claims', 'compliance', 'super admin']}>
                  <AdminDashboard />
                </RoleProtectedRoute>
              } />

           <Route path="admin/profile" element={
             <RoleProtectedRoute allowedRoles={['admin', 'claims', 'compliance', 'super admin']}>
               <AdminProfile />
             </RoleProtectedRoute>
           } />
          
          {/* Admin Routes - Role-based access */}
          
          {/* New Enhanced Admin Tables */}
          <Route path="admin/motor-claims" element={
            <ProtectedRoute>
              <AdminMotorClaimsTable />
            </ProtectedRoute>
          } />
          
          
          <Route path="admin/agents-cdd" element={
            <ProtectedRoute>
              <AdminAgentsCDDTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/individual-cdd" element={
            <ProtectedRoute>
              <AdminIndividualCDDTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/rent-assurance-claims" element={
            <ProtectedRoute>
              <AdminRentAssuranceClaimsTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/money-insurance-claims" element={
            <ProtectedRoute>
              <AdminMoneyInsuranceClaimsTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/burglary-claims" element={
            <ProtectedRoute>
              <AdminBurglaryClaimsTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/contractors-plant-machinery-claims" element={
            <ProtectedRoute>
              <AdminContractorsPlantMachineryClaimsTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/fidelity-guarantee-claims" element={
            <ProtectedRoute>
              <AdminFidelityGuaranteeClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/fire-special-perils-claims" element={
            <ProtectedRoute>
              <AdminFireSpecialPerilsClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/employers-liability-claims" element={
            <ProtectedRoute>
              <AdminEmployersLiabilityClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/all-risk-claims" element={
            <ProtectedRoute>
              <AdminAllRiskClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/professional-indemnity-claims" element={
            <ProtectedRoute>
              <AdminProfessionalIndemnityClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/public-liability-claims" element={
            <ProtectedRoute>
              <AdminPublicLiabilityClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/combined-gpa-employers-liability-claims" element={
            <ProtectedRoute>
              <AdminCombinedGPAEmployersLiabilityClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/group-personal-accident-claims" element={
            <ProtectedRoute>
              <AdminGroupPersonalAccidentClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/goods-in-transit-claims" element={
            <ProtectedRoute>
              <AdminGoodsInTransitClaimsTable />
            </ProtectedRoute>
          } />

          <Route path="admin/kyc/individual" element={
            <ProtectedRoute>
              <AdminIndividualKYCTable />
            </ProtectedRoute>
          } />

          <Route path="admin/kyc/corporate" element={
            <ProtectedRoute>
              <AdminCorporateKYCTable />
            </ProtectedRoute>
          } />

          {/* Individual Claims Admin Tables */}
          <Route path="admin/claims/motor" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="motor" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/professional-indemnity" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="professional-indemnity" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/public-liability" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="public-liability" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/employers-liability" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="employers-liability" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/combined-gpa-employers" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="combined-gpa-employers" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/burglary" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="burglary" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/group-personal-accident" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="group-personal-accident" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/fire-special-perils" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="fire-special-perils" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/rent-assurance" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="rent-assurance" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/money-insurance" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="money-insurance" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/goods-in-transit" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="goods-in-transit" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/contractors-plant-machinery" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="contractors-plant-machinery" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/all-risk" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="all-risk" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/claims/fidelity-guarantee" element={
            <ProtectedRoute>
              <AdminClaimsTable formType="fidelity-guarantee" />
            </ProtectedRoute>
          } />
          
          {/* Individual KYC Admin Tables */}
          <Route path="admin/kyc/individual" element={
            <ProtectedRoute>
              <AdminKYCTable formType="individual" />
            </ProtectedRoute>
          } />
          
          <Route path="admin/kyc/corporate" element={
            <ProtectedRoute>
              <AdminKYCTable formType="corporate" />
            </ProtectedRoute>
          } />
          
          {/* Individual CDD Admin Tables */}
          <Route path="admin/cdd/individual" element={
            <ProtectedRoute>
              <AdminIndividualCDDTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/cdd/corporate" element={
            <ProtectedRoute>
              <AdminCorporateCDDTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/cdd/partners" element={
            <ProtectedRoute>
              <AdminPartnersCDDTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/cdd/agents" element={
            <ProtectedRoute>
              <AdminAgentsCDDTable />
            </ProtectedRoute>
          } />
          
          <Route path="admin/cdd/brokers" element={
            <ProtectedRoute>
              <AdminBrokersCDDTable />
            </ProtectedRoute>
          } />
          
           <Route path="admin/users" element={
             <RoleProtectedRoute allowedRoles={['super admin']}>
               <AdminUsersTable />
             </RoleProtectedRoute>
           } />
          
          <Route path="admin/form/:collection/:id" element={
            <ProtectedRoute>
              <FormViewer />
            </ProtectedRoute>
          } />
          
          <Route path="admin/corporate-cdd/:id" element={
            <ProtectedRoute>
              <CorporateCDDViewer />
            </ProtectedRoute>
          } />
          
          <Route path="admin/form/partners-kyc/:id" element={
            <ProtectedRoute>
              <PartnersCDDViewer />
            </ProtectedRoute>
          } />
          
              <Route path="admin/events-log" element={
                <RoleProtectedRoute allowedRoles={['admin', 'claims', 'compliance', 'super admin']}>
                  <EventsLogPage />
                </RoleProtectedRoute>
              } />
             
             <Route path="unauthorized" element={<Unauthorized />} />
             <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster />
        </MFAHelper>
      </Router>
    </AuthProvider>
  );
}

export default App;
