import React from 'react'
import './index.scss'
import { Link } from 'react-router-dom';
import {images} from '../../Constants'
import TransitionsModal from '../../Containers/Modals/Modal';
import IndiModal from '../../Containers/Modals/IndiModal';

const Navbar = () => {
  return (
    <div>
        <nav>
  <div className="logo">

  <Link to="/">
  
    <img src={images.logo} className='nav-logo' alt="logo" />
  </Link>
  </div>

  <div className="hamburger">
  <TransitionsModal />
  <IndiModal />
  <div id="indicator"></div>
  </div>
</nav>
    </div>
  )
}

export default Navbar