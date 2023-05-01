import React from 'react'
import Navbar from '../Components/Navbar copy'
import Courses from '../EmployabilityContainers/Courses/Courses'
import About from '../EmployabilityContainers/About/About'
import PriceTable from '../EmployabilityContainers/PriceTable/PriceTable'
import Footer from './../Review-Constants/Footer/index';
import Hero from '../EmployabilityContainers/Hero/Hero';
import { motion } from 'framer-motion'


const Employability = () => {
  return (
    <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}
    >
    <Navbar />
    <Hero />
    <About />
    <Courses />
    <PriceTable />
    <Footer />
    </motion.div>
  )
}

export default Employability