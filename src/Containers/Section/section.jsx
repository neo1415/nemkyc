import React from 'react'
import { images } from '../../Constants';
import './Section.scss'
import { Link } from 'react-router-dom';

const Section = () => {
  return (
<section id='section'>
<Link to='/corporate-kyc'>
  <div class="card">
    <img src={images.bg2} alt="Image 1" />
    <div class="overlay">
      <h2>CORPORATE<br/>FORM</h2>
    </div>
  </div>
  </Link>
  <Link to='/individual-kyc'>
  <div class="card">
    <img src={images.bg1} alt="Image 2" />
    <div class="overlay">
      <h2>INDIVIDUAL <br /> FORM</h2>
    </div>
  </div>
  </Link>
</section>

  )
}

export default Section