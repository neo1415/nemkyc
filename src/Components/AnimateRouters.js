import React from 'react'
import { Routes,Route,useLocation } from 'react-router-dom';
import Home from '../Pages/Home';
import { AnimatePresence } from 'framer-motion';
import CDD from '../Containers/CDD';
import KYC from './../Containers/KYC';
import Corporate from '../Containers/Corporate';

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
            {/* <Route exact path="/corporate"
            element={<Corporate />} />   */}
        </Routes>
    </AnimatePresence>

    </div>
  )
}

export default AnimateRouters