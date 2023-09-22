import React, { useState, useEffect } from 'react';
import './Sidebar.scss';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';
import { HiUser, HiUsers, HiDatabase } from 'react-icons/hi';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../../APi/index';
import { HiUserAdd } from 'react-icons/hi';

const Sidebar = () => {
  const { logout, user } = UserAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (e) {
      console.log(e.message);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(db, 'userroles', user.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().role);
        }
      }
    };
  
    fetchUserRole();
  }, [user]); // This will refresh the userRole whenever the user changes
  

  return (
    <div className="sidebar">
      <div className="Top">
        <h5>NEM</h5>
      </div>
      <hr></hr>
      <div className="center">
        <ul>
          <Link to="/adminHome">
            <li className="sideList">
              <p>Dashboard</p>
              <div className="icon">
                <HiDatabase />
              </div>
            </li>
          </Link>
          <Link to="/list">
            <li className="sideList">
              <p>Corporate</p>
              <div className="icon">
                <HiUsers />
              </div>
            </li>
          </Link>
          <Link to="/individual-list">
            <li className="sideList">
              <p>Individual</p>
              <div className="icon">
                <HiUser />
              </div>
            </li>
          </Link>
          {userRole === 'admin' && (
            <Link to="/role-assignment">
              <li className="sideList">
                <p>Role Assignment</p>
                <div className="icon">
                  <HiUserAdd />
                </div>
              </li>
            </Link>
          )}
        </ul>
      </div>
      <hr />
      <div className="bottom">
        <li className="logout" onClick={handleLogout}>
          LogOut
        </li>
      </div>
    </div>
  );
};

export default Sidebar;
