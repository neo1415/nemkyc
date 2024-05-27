import React from "react";
import "./index.scss";
import { images } from "../../Constants";

const Hero = () => {
  return (
    <div className="hero-flex">
<div className="content">
<h2 className="heading">NEM Insurance PLC: Due Diligence You Can Trust</h2>
  <p className="sub"> The Standard in Comprehensive Customer Due Diligence..</p>
<a className="smooth-scroll" href='#section'>
  <button className="main__button">Get started</button>
  </a>
</div>
<div className="cdd-image">
<img src={images.CDDHero} className="cdd-hero-image" alt="hero" />
<div className="circle"></div>
</div>

 
</div>


  );
};

export default Hero;