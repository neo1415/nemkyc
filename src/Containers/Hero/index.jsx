import React from "react";
import "./index.scss";
import { images } from "../../Constants";

const Hero = () => {
  return (
    <div className="hero-flex">
<div className="content">
  <h2 className="heading">NEM INSURANCE CUSTOMER FEEDBACK</h2>
  <p className="sub">For Efficient Communication and prompt feedback services</p>
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

export default Hero;