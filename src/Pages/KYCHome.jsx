import React from 'react'
import { motion } from 'framer-motion';
import Navbar from '../Components/Navbar/index';
import Hero from '../Containers/Hero';
import Section from '../Containers/Section/section';
import Footer from '../Containers/Footer';
import KYCHero from '../Containers/KYCHero';
import KYCSection from '../Containers/KYCSection/KYCSection';

const KYCHome = () => {
  return (
    <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}

     id='homepage'>
      <Navbar />
      <KYCHero />
      <KYCSection />
      <Footer />
    </motion.div>
  )
}

export default KYCHome