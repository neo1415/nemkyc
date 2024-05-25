import React from 'react'
import './Section.scss'
import { images } from '../../Constants';
import PartnersWrapper from '../Modals/PartnersModal';
import BrokersWrapper from '../Modals/BrokersModal';
import { Link } from 'react-router-dom';

const MainSection = () => {
  return (
    <div>
<h1 className='section-header'>
  Select the Appropriate Information to Fill
</h1>

<section id='section'>

<div class="card " >
<Link to='/know-your-customer'>
    <img src={images.bg1} alt="2" />
    <div className="overlay">
      <h2>KYC FORM</h2>
    </div>
    </Link>
  </div>

  <div class="card " >
    <Link to='/customer-due-dilligence'>
    <img src={images.bg2} alt="2" />
    <div className="overlay">
      <h2> CDD FORM</h2>
    </div>
    </Link>
  </div>

</section>
</div>
  )
}

export default MainSection