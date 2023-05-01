import React from 'react'
import HeroSection from '../Review-Constants/HeroSection/index';
import Services from '../Review-Constants/Services/index';
import Footer from '../Review-Constants/Footer/index';
import { homeObjOne, homeObjTwo, homeObjThree } from '../Review-Constants/InfoSection/Data';
import InfoSection from '../Review-Constants/InfoSection/index';
import PriceTable from '../Review-Constants/PriceTable/PriceTable';
import FAQ from '../Review-Constants/FaQ/FAQ';
import Navbar from '../Components/Navbar copy';
import { motion } from 'framer-motion'

const CVReview = () => {
  return (
    <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}

    id='cv'>
    <Navbar />

    <HeroSection />
    <Services />
    <InfoSection {...homeObjOne} />
    <InfoSection {...homeObjTwo} />
    <InfoSection {...homeObjThree} />
    <PriceTable />
    <FAQ />
    {/* <Section /> */}
    <Footer />
    </motion.div>
  )
}

export default CVReview