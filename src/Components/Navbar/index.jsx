import React from 'react'
import './index.scss'
import { Link } from 'react-router-dom';
import logo from './logo-white.png'

const Navbar = () => {
  return (
    <div>
        <nav>
  <div class="logo">

  <Link to="/">
  
    <img src={logo} className='nav-logo' alt="logo" />
  </Link>
  </div>

  <div class="hamburger">
  <Link to="/know-your-customer">KYC Form</Link>
  <Link to="/customer-due-dilligence">CDD Form</Link>
  <div id="indicator"></div>
  </div>
</nav>
    </div>
  )
}

export default Navbar