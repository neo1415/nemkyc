import React from 'react'
import { Routes,Route,useLocation } from 'react-router-dom';
import Home from '../Pages/Home';
import { AnimatePresence } from 'framer-motion';
import KYC from './../Containers/KYC';
import Corporate from '../Containers/Corporate';
import NAICOM from '../Containers/Naicom';
import Brokers from '../Containers/Brokers';
import Partners from '../Containers/Partners';
import Agents from '../Containers/Agents';
import MainHome from '../Pages/MainHome';
import KYCHome from '../Pages/KYCHome';
import IndividualKYC from '../Containers/Individual-KYC';
import CorporateKYC from '../Containers/Corporate-KYC';
import PartnersNaicom from '../Containers/Partners-Naicom';

const AnimateRouters = () => {

    const location= useLocation()

  return (

    <div>
    <AnimatePresence>
        <Routes location={location} key={location.pathname} >
            <Route exact path="/"
            element = {<MainHome />} />
            <Route exact path="/know-your-customer"
            element = {<KYCHome/>} />
            <Route exact path="/customer-due-dilligence"
            element = {<Home />} />
            <Route exact path="/corporate"
            element = {<Corporate />} />
            <Route exact path="/individual-kyc"
            element = {<KYC />} />
            <Route exact path="/naicom-approved"
            element={<NAICOM />} />  
            <Route exact path="/brokers"
            element={<Brokers />} />  
            <Route exact path="/partners-naicom"
            element={<PartnersNaicom />} />  
            <Route exact path="/partners"
            element={<Partners />} />  
            <Route exact path="/agents"
            element={<Agents />} />  
            <Route exact path="/individual"
            element={<IndividualKYC />} />  
            <Route exact path="/corporate-kyc"
            element={<CorporateKYC />} />  
        </Routes>
    </AnimatePresence>

    </div>
  )
}

export default AnimateRouters