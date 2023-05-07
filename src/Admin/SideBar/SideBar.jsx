import React from 'react'
import './Sidebar.scss'
import logo from './logo-white.png'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../../Context/AuthContext'
import { HiUser, HiUsers, HiDatabase } from 'react-icons/hi'

const SideBar = () => {
  const {user, logout} = UserAuth()

  const navigate = useNavigate()

  const handleLogout = async () => {
    try{
      await logout()
      navigate('/signin')

    }catch (e){
      console.log(e.message)
    }
  }



  return (
    <div className='sidebar'>
        <div className='Top'>
        {/* <img className='logo' src={logo}/> */}
        <h5>NEM</h5>
            <p>{user && user.displayName}</p>
        </div>
        <hr></hr>
        <div className='center'>
            <ul>
              <Link to ='/adminHome'>
                  <li className='sideList'>
                  <p>
                  Dashboard
                  </p>
                  <div className='icon'>
                    <HiDatabase />
                  </div>
                  </li>
                </Link> 
              <Link to ='/list'>
                  <li className='sideList'>
                    <p>Corporate</p>
                    <div className='icon'>
                    <HiUsers />
                    </div> 
                  </li>
                </Link> 
                <Link to ='/individual-list'>
                  <li className='sideList'>
                  <p>Individual</p>
                  <div className='icon'>
                    <HiUser />
                    </div> 
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