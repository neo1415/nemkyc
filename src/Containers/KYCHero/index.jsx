import React from "react";
import "./index.scss";
import { images } from "../../Constants";

const KYCHero = () => {
  return (
    <div className="hero-flex">
<div className="content">
<h2 className="heading">NEM Insurance: Know Your Customer, Know Your Safety Now</h2>
  <p className="sub">Trustworthy Solutions for Complete and Accurate Customer Verification..</p>
<a className="smooth-scroll" href='#section'>
  <button className="main__button">Get started</button>
  </a>
</div>
<div className="kyc-image">
<img src={images.KYCHero} className="kyc-hero-image" alt="hero" />
<div className="circle"></div>
</div>

 
</div>


  );
};

export default KYCHero;