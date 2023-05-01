import React from 'react'
import { motion } from 'framer-motion';
import Navbar from './../Components/Navbar/index';
import Hero from '../Containers/Hero';
import CDD from './../Containers/CDD/index';
import KYC from '../Containers/KYC';
import Section from '../Containers/Section/section';

const Home = () => {
  return (
    <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}

     id='homepage'>
      <Navbar />
      <Hero />
      <Section />
    </motion.div>
  )
}

export default Home