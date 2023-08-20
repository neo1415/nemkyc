import React from 'react'
import './AdminHome.scss'
import Widget from './WIdgets/Widget';
import SideBar from './SideBar/SideBar';
import { UserAuth } from '../Context/AuthContext'
// import { HiSearch } from 'react-icons/hi';
import Individual from './homeAdmin/corporateAdmin';
import List from './homeAdmin/Table';
import useAutoLogout from '../Components/Timeout';

const AdminHome = () => {
  const {user} = UserAuth()

  const { logout } = UserAuth(); // Replace UserAuth with your authentication context

  // Use the custom hook to implement automatic logout
  useAutoLogout({
    timeoutDuration: 10 * 60 * 1000 ,//(adjust as needed)
    logout, // Use the logout function from your context
    redirectPath: '/signin', // Specify the redirect path
  });

  
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
    </div>
  )
}

export default AdminHome