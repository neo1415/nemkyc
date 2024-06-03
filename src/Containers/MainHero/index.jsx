import React from "react";
import "./index.scss";
import { images } from "../../Constants";

const MainHero = () => {
  return (
    <div className="hero-flex">
<div className="content">
<h2 className="heading">NEM INSURANCE PLC KYC/CDD Information Collection Center</h2>
  <p className="sub">Streamlined KYC and CDD Solutions for Secure Online Transactions.</p>
<a className="smooth-scroll" href='#section'>
  <button className="main__button">Get started</button>
  </a>
</div>
<div className="main-image">
<img src={images.hero} className="main-hero-image" alt="hero" />
<div className="circle"></div>
</div>

 
</div>


  );
};

export default MainHero;