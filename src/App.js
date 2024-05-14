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

function App() {

  return (
    <div className="App">
    <UserRoleProvider>
      <AuthContextProvider>
        <AnimateRouters />
 
          <Routes>
            <Route exact path="/signin" element={<SignIn />} />

            <Route exact path="/requestpasswordreset"
            element = {<RequestPasswordReset />} />
            <Route exact path="/resetpassword"
            element = {<ResetPassword />} />
            <Route
              exact
              path="/role-assignment"
              element={
    <ProtectedRoute  adminOnly={true}>
      <RoleAssignment />
    </ProtectedRoute>
  }
/>
            <Route
              exact
              path="/user-registration"
              element={
                <ProtectedRoute adminOnly={true}>
                  <UserRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              exact
              path="/adminHome"
              element={
                <ProtectedRoute >
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            <Route
              exact
              path="/list"
              element={
                <ProtectedRoute>
                  <List />
                </ProtectedRoute>
              }
            />
            <Route
              path="/list/:id"
              element={
                <ProtectedRoute>
                  <SingleUser />
                </ProtectedRoute>
              }
            />
            <Route
              exact
              path="/individual-list"
              element={
                <ProtectedRoute>
                  <Individual />
                </ProtectedRoute>
              }
            />
            <Route
              path="/individual-list/:id"
              element={
                <ProtectedRoute>
                  <IndividualUser />
                </ProtectedRoute>
              }
            />

<Route
              exact
              path="brokers-list"
              element={
                <ProtectedRoute>
                  <BrokersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/brokers-list/:id"
              element={
                <ProtectedRoute>
                  <BrokersPage />
                </ProtectedRoute>
              }
            />

            <Route
              exact
              path="partners-list"
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
              exact
              path="agents-list"
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
          </Routes>
      
      </AuthContextProvider>
      </UserRoleProvider>
    </div>
  );
}

export default App;
