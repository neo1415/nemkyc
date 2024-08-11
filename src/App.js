import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import List from './Admin/Table';
import ProtectedRoute from './Admin/Authentication/ProtectedRoute';
import { AuthContextProvider } from './Context/AuthContext';
import AnimateRouters from './Components/AnimateRouters';
import SignIn from './Admin/Authentication/SignIn';
import AdminHome from './Admin/AdminHome';
import Individual from './Admin/Individual';
import IndividualUser from './Admin/SingleUser/individualUser';
import SingleUser from './Admin/SingleUser/SingleUser';
import UserRegistration from './Admin/Authentication/SignUp';
import RoleAssignment from './Admin/Authentication/RoleAssignment';
import { UserRoleProvider } from './Context/UserRole';
import RequestPasswordReset from './Admin/Authentication/RequestPasswordReset';
import ResetPassword from './Admin/Authentication/ResetPassword';
import BrokersList from './Admin/Brokers';
import BrokersPage from './Admin/SingleUser/BrokersPage';
import PartnersList from './Admin/Partners';
import PartnersPage from './Admin/SingleUser/PartnersPage';
import AgentsList from './Admin/Agents';
import AgentsPage from './Admin/SingleUser/AgentsPage';
import CorporateKYCTable from './Admin/corporate-kyc-table';
import CorporateSinglePage from './Admin/SingleUser/CorporateSinglePage';
import IndividualKYCTable from './Admin/individual-kyc-table';
import IndividualSinglePage from './Admin/SingleUser/IndividualSinglePage';
import LogsTable from './Admin/Logs/Logs';
import LogDetails from './Admin/Logs/LogDetails';
import Unauthourized from './Components/Unauthourized';
import SuccessEmail from './Components/email success';

function App() {
  return (
    <div className="App">
      <UserRoleProvider>
        <AuthContextProvider>
          <AnimateRouters />
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/requestpasswordreset" element={<RequestPasswordReset />} />
            <Route path="/resetpassword" element={<ResetPassword />} />
            <Route
              path="/role-assignment"
              element={
                <ProtectedRoute adminOnly={true}>
                  <RoleAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-registration"
              element={
                <ProtectedRoute adminOnly={true}>
                  <UserRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adminHome"
              element={
                <ProtectedRoute >
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/list"
              element={
                <ProtectedRoute >
                  <List />
                </ProtectedRoute>
              }
            />
            <Route
              path="/list/:id"
              element={
                <ProtectedRoute >
                  <SingleUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/individual-list"
              element={
                <ProtectedRoute >
                  <Individual />
                </ProtectedRoute>
              }
            />
            <Route
              path="/individual-list/:id"
              element={
                <ProtectedRoute >
                  <IndividualUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/brokers-list"
              element={
                <ProtectedRoute >
                  <BrokersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/brokers-list/:id"
              element={
                <ProtectedRoute >
                  <BrokersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partners-list"
              element={
                <ProtectedRoute>
                  <PartnersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partners-list/:id"
              element={
                <ProtectedRoute>
                  <PartnersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents-list"
              element={
                <ProtectedRoute>
                  <AgentsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents-list/:id"
              element={
                <ProtectedRoute>
                  <AgentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/corporatekyc-list"
              element={
                <ProtectedRoute>
                  <CorporateKYCTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/corporatekyc-list/:id"
              element={
                <ProtectedRoute>
                  <CorporateSinglePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/individualkyc-list"
              element={
                <ProtectedRoute>
                  <IndividualKYCTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/individualkyc-list/:id"
              element={
                <ProtectedRoute>
                  <IndividualSinglePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute adminOnly={true}>
                  <LogsTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs/:id"
              element={
                <ProtectedRoute adminOnly={true}>
                  <LogDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthourized" element={<Unauthourized />} />
            <Route path="/email-succesful" element={<SuccessEmail />} />
            {/* <Route path="*" element={<Navigate to="/unauthourized" />} /> */}
          </Routes>
        </AuthContextProvider>
      </UserRoleProvider>
    </div>
  );
}

export default App;
