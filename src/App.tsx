import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import Index from './pages/Index';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';
import ResetPasswordConfirm from './pages/auth/ResetPasswordConfirm';
import UserDashboard from './pages/dashboard/UserDashboard';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';

// ============= CRITICAL PATH COMPONENTS (Eager Loaded) =============
// These load immediately for best first-time user experience
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import MFAEnrollment from './components/auth/MFAEnrollment';
import MFAVerification from './components/auth/MFAVerification';

// Component to handle inactivity timeout (must be inside AuthProvider)
const InactivityHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useInactivityTimeout();
  return <>{children}</>;
};

// ============= LAZY LOADED COMPONENTS =============
// These load on-demand for better performance

// Admin Dashboard & Pages
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const FormViewer = lazy(() => import('./pages/admin/FormViewer'));
const UserFormViewer = lazy(() => import('./pages/dashboard/UserFormViewer'));
const EventsLogPage = lazy(() => import('./pages/admin/EventsLogPage'));
const CorporateCDDViewer = lazy(() => import('./pages/admin/CorporateCDDViewer'));
const PartnersCDDViewer = lazy(() => import('./pages/admin/PartnersCDDViewer'));

// Admin Tables - KYC
const AdminKYCTable = lazy(() => import('./pages/admin/AdminKYCTable'));
const AdminIndividualKYCTable = lazy(() => import('./pages/admin/AdminIndividualKYCTable'));
const AdminCorporateKYCTable = lazy(() => import('./pages/admin/AdminCorporateKYCTable'));

// Admin Tables - CDD
const AdminCDDTable = lazy(() => import('./pages/admin/AdminCDDTable'));
const AdminIndividualCDDTable = lazy(() => import('./pages/admin/AdminIndividualCDDTable'));
const AdminCorporateCDDTable = lazy(() => import('./pages/admin/AdminCorporateCDDTable'));
const AdminAgentsCDDTable = lazy(() => import('./pages/admin/AdminAgentsCDDTable'));
const AdminPartnersCDDTable = lazy(() => import('./pages/admin/AdminPartnersCDDTable'));
const AdminBrokersCDDTable = lazy(() => import('./pages/admin/AdminBrokersCDDTable'));

// Admin Tables - Claims
const AdminClaimsTable = lazy(() => import('./pages/admin/AdminClaimsTable'));
const AdminMotorClaimsTable = lazy(() => import('./pages/admin/AdminMotorClaimsTable'));
const AdminRentAssuranceClaimsTable = lazy(() => import('./pages/admin/AdminRentAssuranceClaimsTable'));
const AdminMoneyInsuranceClaimsTable = lazy(() => import('./pages/admin/AdminMoneyInsuranceClaimsTable'));
const AdminBurglaryClaimsTable = lazy(() => import('./pages/admin/AdminBurglaryClaimsTable'));
const AdminContractorsPlantMachineryClaimsTable = lazy(() => import('./pages/admin/AdminContractorsPlantMachineryClaimsTable'));
const AdminFidelityGuaranteeClaimsTable = lazy(() => import('./pages/admin/AdminFidelityGuaranteeClaimsTable'));
const AdminFireSpecialPerilsClaimsTable = lazy(() => import('./pages/admin/AdminFireSpecialPerilsClaimsTable'));
const AdminEmployersLiabilityClaimsTable = lazy(() => import('./pages/admin/AdminEmployersLiabilityClaimsTable'));
const AdminAllRiskClaimsTable = lazy(() => import('./pages/admin/AdminAllRiskClaimsTable'));
const AdminProfessionalIndemnityClaimsTable = lazy(() => import('./pages/admin/AdminProfessionalIndemnityClaimsTable'));
const AdminPublicLiabilityClaimsTable = lazy(() => import('./pages/admin/AdminPublicLiabilityClaimsTable'));
const AdminCombinedGPAEmployersLiabilityClaimsTable = lazy(() => import('./pages/admin/AdminCombinedGPAEmployersLiabilityClaimsTable'));
const AdminGroupPersonalAccidentClaimsTable = lazy(() => import('./pages/admin/AdminGroupPersonalAccidentClaimsTable'));
const AdminGoodsInTransitClaimsTable = lazy(() => import('./pages/admin/AdminGoodsInTransitClaimsTable'));
const AdminUsersTable = lazy(() => import('./pages/admin/AdminUsersTable'));

// KYC Forms
const KYCForms = lazy(() => import('./pages/kyc/KYCForms'));
const IndividualKYC = lazy(() => import('./pages/kyc/IndividualKYC'));
const CorporateKYC = lazy(() => import('./pages/kyc/CorporateKYC'));

// CDD Forms
const CDDForms = lazy(() => import('./pages/cdd/CDDForms'));
const IndividualCDD = lazy(() => import('./pages/cdd/IndividualCDD'));
const CorporateCDD = lazy(() => import('./pages/cdd/CorporateCDD'));
const NaicomCorporateCDD = lazy(() => import('./pages/cdd/NaicomCorporateCDD'));
const PartnersCDD = lazy(() => import('./pages/cdd/PartnersCDD'));
const NaicomPartnersCDD = lazy(() => import('./pages/cdd/NaicomPartnersCDD'));
const AgentsCDD = lazy(() => import('./pages/cdd/AgentsCDD'));
const BrokersCDD = lazy(() => import('./pages/cdd/BrokersCDD'));

// Claims Forms
const ClaimsForms = lazy(() => import('./pages/claims/ClaimsForms'));
const MotorClaim = lazy(() => import('./pages/claims/MotorClaim'));
const ProfessionalIndemnityClaimForm = lazy(() => import('./pages/claims/ProfessionalIndemnityClaimForm'));
const PublicLiabilityClaimForm = lazy(() => import('./pages/claims/PublicLiabilityClaimForm'));
const EmployersLiabilityClaim = lazy(() => import('./pages/claims/EmployersLiabilityClaim'));
const CombinedGPAEmployersLiabilityClaim = lazy(() => import('./pages/claims/CombinedGPAEmployersLiabilityClaim'));
const BurglaryClaimForm = lazy(() => import('./pages/claims/BurglaryClaimForm'));
const GroupPersonalAccidentClaim = lazy(() => import('./pages/claims/GroupPersonalAccidentClaim'));
const FireSpecialPerilsClaim = lazy(() => import('./pages/claims/FireSpecialPerilsClaim'));
const RentAssuranceClaim = lazy(() => import('./pages/claims/RentAssuranceClaim'));
const MoneyInsuranceClaim = lazy(() => import('./pages/claims/MoneyInsuranceClaim'));
const GoodsInTransitClaim = lazy(() => import('./pages/claims/GoodsInTransitClaim'));
const ContractorsPlantMachineryClaim = lazy(() => import('./pages/claims/ContractorsPlantMachineryClaim'));
const AllRiskClaim = lazy(() => import('./pages/claims/AllRiskClaim'));
const FidelityGuaranteeClaim = lazy(() => import('./pages/claims/FidelityGuaranteeClaim'));

// Demo Pages - Identity Verification
const DemoConfig = lazy(() => import('./pages/demo/DemoConfig'));
const NINVerification = lazy(() => import('./pages/demo/NINVerification'));
const CACVerification = lazy(() => import('./pages/demo/CACVerification'));

// Remediation Pages
const AdminRemediationBatches = lazy(() => import('./pages/admin/AdminRemediationBatches'));
const AdminRemediationRecords = lazy(() => import('./pages/admin/AdminRemediationRecords'));
const RemediationAuditLogs = lazy(() => import('./pages/admin/RemediationAuditLogs'));

// Identity Collection Pages (New flexible system)
const IdentityListsDashboard = lazy(() => import('./pages/admin/IdentityListsDashboard'));
const IdentityListDetail = lazy(() => import('./pages/admin/IdentityListDetail'));

// Public Verification Page (no auth required)
const CustomerVerificationPage = lazy(() => import('./pages/public/CustomerVerificationPage'));

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);


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
    <ErrorBoundary>
      <AuthProvider>
        <InactivityHandler>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
              
              {/* Auth routes with /auth prefix */}
              <Route path="auth/signin" element={<SignIn />} />
              <Route path="auth/signup" element={<SignUp />} />
              <Route path="auth/reset-password" element={<ResetPassword />} />
              
              {/* Password reset confirmation from email link */}
              <Route path="resetpassword" element={<ResetPasswordConfirm />} />
              
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

             {/* Demo Routes - Identity Verification Demo (No Auth Required) */}
             <Route path="demo/config" element={<DemoConfig />} />
             <Route path="demo/verify/nin" element={<NINVerification />} />
             <Route path="demo/verify/cac" element={<CACVerification />} />
             
             {/* Public Verification Route - Customer Identity Remediation (No Auth Required) */}
             <Route path="verify/:token" element={<CustomerVerificationPage />} />
             
             {/* Salvage Presentation - Use standalone HTML at /salvage-presentation.html */}
             
             {/* Protected Routes */}
             <Route path="dashboard" element={
               <ProtectedRoute>
                 <UserDashboard />
               </ProtectedRoute>
             } />
             
             {/* User Form Viewer Route */}
             <Route path="submission/:collection/:id" element={
               <ProtectedRoute>
                 <UserFormViewer />
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

          {/* Identity Remediation Routes */}
          <Route path="admin/remediation" element={
            <RoleProtectedRoute allowedRoles={['admin', 'compliance', 'super admin']}>
              <AdminRemediationBatches />
            </RoleProtectedRoute>
          } />
          
          <Route path="admin/remediation/audit-logs" element={
            <RoleProtectedRoute allowedRoles={['admin', 'compliance', 'super admin']}>
              <RemediationAuditLogs />
            </RoleProtectedRoute>
          } />
          
          <Route path="admin/remediation/:batchId" element={
            <RoleProtectedRoute allowedRoles={['admin', 'compliance', 'super admin']}>
              <AdminRemediationRecords />
            </RoleProtectedRoute>
          } />

          {/* Identity Collection Routes (New flexible system) */}
          <Route path="admin/identity" element={
            <RoleProtectedRoute allowedRoles={['broker', 'admin', 'compliance', 'super admin']}>
              <IdentityListsDashboard />
            </RoleProtectedRoute>
          } />
          
          <Route path="admin/identity/:listId" element={
            <RoleProtectedRoute allowedRoles={['broker', 'admin', 'compliance', 'super admin']}>
              <IdentityListDetail />
            </RoleProtectedRoute>
          } />
             
             <Route path="unauthorized" element={<Unauthorized />} />
             <Route path="*" element={<NotFound />} />
            </Route>
            </Routes>
          </Suspense>
          <Toaster />
        </Router>
        </InactivityHandler>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
