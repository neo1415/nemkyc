import React, { useState } from "react";
import './index.scss'

import { IoClose, IoMenu } from "react-icons/io5";
import "./index.scss";
import images from '../../Constants/images'
import CorporateKYCNav from '../../Containers/Modals/CorporateKYCNav';
import IndividualKYCNav from '../../Containers/Modals/individualKYCNav';

const KYCNav = () => {
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
              <div  className="nav__link" onClick={closeMenuOnMobile}>
                <CorporateKYCNav/>

              </div>
            </li>
            <li className="nav__item">
              <div
               
                className="nav__link"
                onClick={closeMenuOnMobile}
              >
               <IndividualKYCNav />
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

export default KYCNav