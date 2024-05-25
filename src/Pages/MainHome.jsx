import React from 'react'
import { motion } from 'framer-motion';
import Navbar from '../Components/Navbar/index';
import Hero from '../Containers/Hero';
import Section from '../Containers/Section/section';
import Footer from '../Containers/Footer';
import MainSection from '../Containers/MainSection/MainSection';
import MainHero from '../Containers/MainHero';

const MainHome = () => {
  return (
    <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}

     id='homepage'>
      <Navbar />
      <MainHero />
      <MainSection />
      <Footer />
    </motion.div>
  )
}

export default MainHome