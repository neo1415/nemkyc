import React from 'react'
import './Sidebar.scss'
import { Link, useNavigate } from 'react-router-dom'
// import { UserAuth } from '../../Context/AuthContext'
// import Brands from './../Brands/Brands';
// import { images } from '../../Constants';

const SideBar = () => {
//   const {user, logout} = UserAuth()

  // const navigate = useNavigate()

  const handleLogout = async () => {
    // try{
    //   await logout()
    //   navigate('/signin')

    // }catch (e){
    //   console.log(e.message)
    // }
  }



  return (
    <div className='sidebar'>
        <div className='Top'>
        {/* <img className='logo' src={images.logo}/>
            <p>{user && user.displayName}</p> */}
        </div>
        <hr></hr>
        <div className='center'>
            <ul>
              <Link to ='/adminHome'>
                  <li className='sideList'>
                    Dashboard
                  </li>
                </Link> 
              <Link to ='/list'>
                  <li className='sideList'>
                    CV review
                  </li>
                </Link> 
                <Link to ='/employ'>
                  <li className='sideList'>
                    Basic Path 
                  </li>
                </Link>
                <Link to ='/employ-exec'>
                  <li className='sideList'>
                    Executive Path
                  </li>
                </Link> 
                <Link to ='/contact'>
                  <li className='sideList'>
                    Contact Us
                  </li>
                </Link> 
                <Link to ='/testimonialadmin'>
                  <li className='sideList'>
                    Testimonials
                  </li>
                </Link> 
                <Link to ='/brands'>
                  <li className='sideList'>
                    Brands 
                  </li>
                </Link>
                <Link to ='/upload'>
                  <li className='sideList'>
                    Gallery
                  </li>
                </Link> 
            </ul>
        </div>
        <hr/>
        <div className='bottom'>
        <li className='logout' onClick={handleLogout}>LogOut</li>
        </div>
       
    </div>
  )
}

export default SideBar