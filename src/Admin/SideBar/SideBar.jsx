import React from 'react'
import './Sidebar.scss'
import logo from './logo-white.png'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../../Context/AuthContext'

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
        <img className='logo' src={logo}/>
            <p>{user && user.displayName}</p>
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
                    Corporate
                  </li>
                </Link> 
                <Link to ='/individual-list'>
                  <li className='sideList'>
                    Individual 
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