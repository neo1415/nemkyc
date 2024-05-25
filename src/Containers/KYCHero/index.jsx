import React from "react";
import "./index.scss";
import { images } from "../../Constants";

const KYCHero = () => {
  return (
    <div className="hero-flex">
<div className="content">
<h2 className="heading">NEM INSURANCE PLC Know Your Customer Information Collection Center</h2>
  <p className="sub">Streamlined KYC and CDD Solutions for Secure Online Transactions.</p>
<a className="smooth-scroll" href='#section'>
  <button className="main__button">Get started</button>
  </a>
</div>
<div className="image">
<img src={images.hero} className="hero-image" alt="hero" />
<div className="circle"></div>
</div>

 
</div>


  );
};

export default KYCHero;