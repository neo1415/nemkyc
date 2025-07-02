
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import KYCForms from "./pages/kyc/KYCForms";
import IndividualKYC from "./pages/kyc/IndividualKYC";
import CorporateKYC from "./pages/kyc/CorporateKYC";
import CDDForms from "./pages/cdd/CDDForms";
import ClaimsForms from "./pages/claims/ClaimsForms";
import MotorClaim from "./pages/claims/MotorClaim";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="auth/signin" element={<SignIn />} />
              <Route path="auth/signup" element={<SignUp />} />
              <Route path="unauthorized" element={<Unauthorized />} />
              
              {/* Protected User Routes */}
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              
              {/* KYC Routes */}
              <Route path="kyc" element={
                <ProtectedRoute>
                  <KYCForms />
                </ProtectedRoute>
              } />
              <Route path="kyc/individual" element={
                <ProtectedRoute>
                  <IndividualKYC />
                </ProtectedRoute>
              } />
              <Route path="kyc/corporate" element={
                <ProtectedRoute>
                  <CorporateKYC />
                </ProtectedRoute>
              } />
              
              {/* CDD Routes */}
              <Route path="cdd" element={
                <ProtectedRoute>
                  <CDDForms />
                </ProtectedRoute>
              } />
              
              {/* Claims Routes */}
              <Route path="claims" element={
                <ProtectedRoute>
                  <ClaimsForms />
                </ProtectedRoute>
              } />
              <Route path="claims/motor" element={
                <ProtectedRoute>
                  <MotorClaim />
                </ProtectedRoute>
              } />
              
              {/* Protected Admin Routes */}
              <Route path="admin/dashboard" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="admin/users" element={
                <ProtectedRoute requireAdmin>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Users Management</h1>
                    <p className="text-gray-600">User management interface coming soon...</p>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Placeholder routes for admin sections */}
              <Route path="admin/kyc/*" element={
                <ProtectedRoute requireAdmin>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">KYC Management</h1>
                    <p className="text-gray-600">KYC forms management coming soon...</p>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="admin/cdd/*" element={
                <ProtectedRoute requireAdmin>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">CDD Management</h1>
                    <p className="text-gray-600">CDD forms management coming soon...</p>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="admin/claims/*" element={
                <ProtectedRoute requireAdmin>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Claims Management</h1>
                    <p className="text-gray-600">Claims management coming soon...</p>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
