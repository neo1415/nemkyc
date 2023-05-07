import './App.css';
import React from 'react';
import { Routes, Route, Router} from 'react-router-dom';
import Hero from './Containers/Hero';
import Home from './Pages/Home';
import List from './Admin/Table';
import ProtectedRoute from './Admin/Authentication/ProtectedRoute';
import ResetPassword from './Admin/Authentication/ResetPassword';
import { AuthContextProvider } from './Context/AuthContext';
import AnimateRouters from './Components/AnimateRouters';
import SignIn from './Admin/Authentication/SignIn';
import SignUp from './Admin/Authentication/SignUp';
import AdminHome from './Admin/AdminHome';
import Login from './Admin/Login/Login';
import Individual from './Admin/Individual';
import Navbar from './Components/Navbar';
import Footer from './Containers/Footer';

function App() {

  return (
    <div className="App">
    {/* <Navbar /> */}
      <AuthContextProvider>
      <AnimateRouters />  
        <Routes>

        {/* <Route exact path="/login"
            element = {<Login />} /> */}
        <Route exact path="/signin"
            element = {<SignIn />} />
        <Route exact path="/signup"
            element = {<SignUp />} />
        <Route exact path="/resetpassword"
            element = {<ResetPassword />} />

        <Route exact path="/adminHome">
              <Route index element = {  <ProtectedRoute><AdminHome /></ProtectedRoute>  } />
              {/* <Route path='/adminHome/:id' element = { <ProtectedRoute><SingleUser /></ProtectedRoute>} /> */}
            </Route>
            <Route exact path="/list">
              <Route index element = { <ProtectedRoute><List /></ProtectedRoute>   } />
              {/* <Route path='/list/:id' element = {<ProtectedRoute><SingleUser /></ProtectedRoute>} /> */}
            </Route>

            <Route exact path="/individual-list">
              <Route index element = { <ProtectedRoute><Individual /></ProtectedRoute>   } />
              {/* <Route path='/list/:id' element = {<ProtectedRoute><SingleUser /></ProtectedRoute>} /> */}
            </Route>
        </Routes>
      </AuthContextProvider>
      <Footer />
    </div>
  );
}

export default App;
