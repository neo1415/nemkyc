import React from 'react'
import './index.scss'
import {BsTwitter, BsFacebook, BsInstagram, BsLinkedin} from 'react-icons/bs'

const Footer = () => {
  return (
    <div className="footer">
    <div className="row">
    <a href="https://www.instagram.com/neminsuranceplc"><div className='icons'><BsInstagram /></div> </a>
    <a href="http://www.facebook.com/neminsplc"><div className='icons'><BsFacebook /></div></a>
    <a href="https://twitter.com/neminsuranceplc"><div className='icons'><BsTwitter /> </div></a>
    <a href="https://www.linkedin.com/company/nem-insurance-plc/"><div className='icons'><BsLinkedin /> </div></a>
    </div>
    
    <div className="row">
    <ul>
    <li><a href="https://nem-insurance.com/contact/Contact-Us">Contact us</a></li>
    <li><a href="https://nem-insurance.com/#">Our Services</a></li>
    <li><a href="https://nem-insurance.com/site/privacy-policy">Privacy Policy</a></li>
    </ul>
    </div>
    <hr className='hr'></hr>
    <div className="row">
    NEM insurance Plc Copyright © 2024 NEM Insurance Plc - All rights reserved 
    </div>
    </div>
  )
}

export default Footer