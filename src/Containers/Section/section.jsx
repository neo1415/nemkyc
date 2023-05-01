import React from 'react'
import image1 from './bg1.jpg'
import image2 from './bg2.jpg'
import './Section.scss'
import { Link } from 'react-router-dom';

const Section = () => {
  return (
<section>
<Link to='/corporate-kyc'>
  <div class="card">
    <img src={image1} alt="Image 1" />
    <div class="overlay">
      <h2>CORPORATE</h2>
    </div>
  </div>
  </Link>
  <Link to='/individual-kyc'>
  <div class="card">
    <img src={image2} alt="Image 2" />
    <div class="overlay">
      <h2>INDIVIDUAL</h2>
    </div>
  </div>
  </Link>
</section>

  )
}

export default Section