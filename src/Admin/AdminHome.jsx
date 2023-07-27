import React from 'react'
import './AdminHome.scss'
import Widget from './WIdgets/Widget';
// import List from './homeAdmin/Table';
import Table from './homeAdmin/Table';
// import Header from './homeAdmin/Header';
import SideBar from './SideBar/SideBar';
// import Contact from './homeAdmin/Contact';
// import Account from './Accounts/Account';
import { UserAuth } from '../Context/AuthContext'
import { HiSearch } from 'react-icons/hi';
import Individual from './homeAdmin/corporateAdmin';
import List from './homeAdmin/Table';
import Footer from '../Containers/Footer';

const AdminHome = () => {
  const {user} = UserAuth()
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
      
        <p style={{color:'black', fontSize:18, fontWeight:"500", marginRight:10, color:'#bf2e46'}}>Welcome {user && user.email}</p>

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