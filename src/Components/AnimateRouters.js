import React from 'react'
import { Routes,Route,useLocation } from 'react-router-dom';
import Home from '../Pages/Home';
import { AnimatePresence } from 'framer-motion';
import CDD from '../Containers/CDD';
import KYC from './../Containers/KYC';

const AnimateRouters = () => {

    const location= useLocation()

  return (

    <div>
    <AnimatePresence>
        <Routes location={location} key={location.pathname} >
            <Route exact path="/"
            element = {<Home />} />
            <Route exact path="/corporate-kyc"
            element = {<CDD />} />
            <Route exact path="/individual-kyc"
            element = {<KYC />} />
        </Routes>
    </AnimatePresence>

    </div>
  )
}

export default AnimateRouters