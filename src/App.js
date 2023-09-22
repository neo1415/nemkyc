import './App.css';
import React, { useState, useEffect } from 'react';
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


function App() {

  return (
    <div className="App">
      <AuthContextProvider>
        <AnimateRouters />
 
          <Routes>
            <Route exact path="/signin" element={<SignIn />} />
            <Route
  exact
  path="/role-assignment"
  element={
    <ProtectedRoute adminOnly={false}>
      <RoleAssignment />
    </ProtectedRoute>
  }
/>
            <Route
              exact
              path="/user-registration"
              element={
                <ProtectedRoute adminOnly={false}>
                  <UserRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              exact
              path="/adminHome"
              element={
                <ProtectedRoute adminOnly={false}>
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
          </Routes>
      
      </AuthContextProvider>
    </div>
  );
}

export default App;
