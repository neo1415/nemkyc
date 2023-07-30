import React,{ useEffect, useState } from 'react'
import './AdminHome.scss'
import Widget from './WIdgets/Widget';
import SideBar from './SideBar/SideBar';
import { UserAuth } from '../Context/AuthContext'
import { useNavigate } from 'react-router-dom'
// import { HiSearch } from 'react-icons/hi';
import Individual from './homeAdmin/corporateAdmin';
import List from './homeAdmin/Table';

const AdminHome = () => {
  const navigate = useNavigate()
  const {user,logout} = UserAuth()

    const [isActive, setIsActive] = useState(true);
  
    useEffect(() => {
      const resetTimer = () => {
        setIsActive(true);
      };
  
      // Attach event listeners
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('touchstart', resetTimer);
  
      // Set a timer to check inactivity and log out if needed
      const logoutTimer = setInterval(async () => {
        console.log('Checking activity...');
        if (!isActive) {
          console.log('Logging out...');
          try {
            await logout();
            navigate('/signin');
          } catch (e) {
            console.error('Error during logout:', e.message);
          }
          console.log('User logged out due to inactivity.');
        }
      }, 5 * 1000)
      // Clean up event listeners and timer on component unmount
      return () => {
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);
        window.removeEventListener('touchstart', resetTimer);
        clearInterval(logoutTimer);
      };
    }, [isActive]);
  
  
  return (
    <div className='AdminHome'>
    <div className='listContainer'>
        <SideBar />
    <div className='AdminContainer'>
    <div className='topBar' style={{display:'flex', marginTop:-150}}>
      {/* <div className='search' style={{display:'flex'}}>
        <input type='text' placeholder=' Search pages' className='adminSearch'/>
        <div className='searchIcon'>
        <HiSearch />
        </div>
        
      </div> */}
      <div className='items' style={{display:'flex'}}>
      
        <p style={{fontSize:18, fontWeight:"500", marginRight:10, color:'#bf2e46'}}>Welcome {user && user.email}</p>

      {/* <div className='item'>
        <NotificationsNoneOutlined />
      </div>
      <div className='item'>    
        <ChatBubbleOutlineOutlined />
      </div> */}
      </div>
    </div>
    
    <div className='list-container ' style={{display:'flex'}}>   
      <Widget type='user' />
      <Widget type='basic' />
    </div>   
    <div className='Middle' style={{display:'flex', marginTop:35}}>

    <div className='coList' style={{flex:3}}>
      <List />
    </div>

    <div className='inList' style={{flex:3}}>
     <Individual />
    </div> 
    </div>   
 
    </div>
    </div>
    {/* <Footer /> */}
    </div>
  )
}

export default AdminHome