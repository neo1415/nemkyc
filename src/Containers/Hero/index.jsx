import React from "react";
import "./index.scss";
import image from './hero.png'
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="hero-flex">
<div className="content">
  <h2 class="heading">Trusted Identity Verification for Today's Digital World</h2>
  <p class="sub">Streamlined KYC and CDD Solutions for Secure Online Transactions.</p>
<a className="smooth-scroll" href='#section'>
  <button class="main__button">Get started</button>
  </a>
</div>
<div className="image">
<img src={image} className="hero-image" />
<div className="circle">c</div>
</div>

 
</div>


  );
};

export default Hero;