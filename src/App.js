import './App.css';
import React from 'react';
import { Routes, Route} from 'react-router-dom';
import List from './Admin/Table';
import ProtectedRoute from './Admin/Authentication/ProtectedRoute';
import ResetPassword from './Admin/Authentication/ResetPassword';
import { AuthContextProvider } from './Context/AuthContext';
import AnimateRouters from './Components/AnimateRouters';
import SignIn from './Admin/Authentication/SignIn';
import SignUp from './Admin/Authentication/SignUp';
import AdminHome from './Admin/AdminHome';
import Individual from './Admin/Individual';
import IndividualUser from './Admin/SingleUser/individualUser';
import SingleUser from './Admin/SingleUser/SingleUser';

function App() {

  return (
    <div className="App">
      <AuthContextProvider>
      <AnimateRouters />  
        <Routes>

        <Route exact path="/signin"
            element = {<SignIn />} />
        <Route exact path="/signup"
            element = {<SignUp />} />
        <Route exact path="/resetpassword"
            element = {<ResetPassword />} />

        <Route exact path="/adminHome">
              <Route index element = {  <ProtectedRoute><AdminHome /></ProtectedRoute>  } />
            </Route>
            <Route exact path="/list">
              <Route index element = { <ProtectedRoute><List /></ProtectedRoute>   } />
              <Route path='/list/:id' element = {<ProtectedRoute><SingleUser /></ProtectedRoute>} />
            </Route>

            <Route exact path="/individual-list">
              <Route index element = { <ProtectedRoute><Individual /></ProtectedRoute>   } />
              <Route path='/individual-list/:id' element = {<ProtectedRoute><IndividualUser /></ProtectedRoute>} />
            </Route>
        </Routes>
      </AuthContextProvider>
    
    </div>
  );
}

export default App;
