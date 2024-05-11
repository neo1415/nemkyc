import React from 'react'
import { Routes,Route,useLocation } from 'react-router-dom';
import Home from '../Pages/Home';
import { AnimatePresence } from 'framer-motion';
import KYC from './../Containers/KYC';
import Corporate from '../Containers/Corporate';
import NAICOM from '../Containers/Naicom';
import Brokers from '../Containers/Brokers';
import Partners from '../Containers/Partners';

const AnimateRouters = () => {

    const location= useLocation()

  return (

    <div>
    <AnimatePresence>
        <Routes location={location} key={location.pathname} >
            <Route exact path="/"
            element = {<Home />} />
            <Route exact path="/corporate"
            element = {<Corporate />} />
            <Route exact path="/individual-kyc"
            element = {<KYC />} />
            <Route exact path="/naicom-approved"
            element={<NAICOM />} />  
            <Route exact path="/brokers"
            element={<Brokers />} />  
            <Route exact path="/[artners"
            element={<Partners />} />  
        </Routes>
    </AnimatePresence>

    </div>
  )
}

export default AnimateRouters