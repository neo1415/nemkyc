import React from "react";
import "./index.scss";
import image1 from './bg1.jpg'
import image2 from './bg2.jpg'
import image3 from './bg3.jpg'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-tagline"><span>Welcome</span> To NEM insurance</h1>
        <button className="cta-button">Get Started</button>
      </div>
      <div className="hero-images">
        {/* <img src={image1} alt="Image 1" /> */}
        <img src={image2} alt="Image 2" />
        <img src={image3} alt="Image 3" />
      </div>
    </section>
  );
};

export default Hero;