import React from 'react'
import { motion } from 'framer-motion';
import Navbar from './../Components/Navbar/index';
import Hero from '../Containers/Hero';
import Section from '../Containers/Section/section';
import Footer from '../Containers/Footer';
import CDDNav from '../Components/CDDNav';

const Home = () => {
  return (
    <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}

     id='homepage'>
      <CDDNav />
      <Hero />
      <Section />
      <Footer />
    </motion.div>
  )
}

export default Home