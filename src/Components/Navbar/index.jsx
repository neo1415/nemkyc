import React, { useState } from "react";
import './index.scss'
import { Link } from 'react-router-dom';

import { IoClose, IoMenu } from "react-icons/io5";
import "./index.scss";
import images from '../../Constants/images'

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const closeMenuOnMobile = () => {
    if (window.innerWidth <= 1150) {
      setShowMenu(false);
    }
  };
  return (
    <header className="header">
      <nav className="nav container">
        <div to="/" className="nav__logo">
          <img src={images.logo} alt='logo' className="nem-logo" />
        </div>

        <div
          className={`nav__menu ${showMenu ? "show-menu" : ""}`}
          id="nav-menu"
        >
          <ul className="nav__list">
            <li className="nav__item">
              <div
               
                className="nav__link"
                onClick={closeMenuOnMobile}
              >
   <Link to="/know-your-customer">KYC Form</Link>
              </div>
            </li>
            <li className="nav__item">
              <div
               
                className="nav__link"
                onClick={closeMenuOnMobile}
              >

  <Link to="/customer-due-dilligence">CDD Form</Link>
              </div>
            </li>
          
          </ul>
          <div className="nav__close" id="nav-close" onClick={toggleMenu}>
            <IoClose />
          </div>
        </div>

        <div className="nav__toggle" id="nav-toggle" onClick={toggleMenu}>
          <IoMenu />
        </div>
      </nav>
    </header>
  );
};
export default Navbar