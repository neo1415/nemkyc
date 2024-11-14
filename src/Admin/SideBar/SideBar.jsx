import React, { useState, useEffect } from 'react';
import './Sidebar.scss';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../../Context/AuthContext';
import { HiUsers, HiDatabase} from 'react-icons/hi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../APi/index';
import { HiUserAdd } from 'react-icons/hi';
import { FaHandshake, FaRegBuilding, FaUserAlt } from 'react-icons/fa';
import { FaUserTie } from 'react-icons/fa';
import { FaBuilding } from 'react-icons/fa';
import { FaExchangeAlt } from 'react-icons/fa';


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
              <p>Corporate CDD</p>
              <div className="icon">
                <FaBuilding />
              </div>
            </li>
          </Link>
          <Link to="/corporatekyc-list">
            <li className="sideList">
              <p>Corporate KYC</p>
              <div className="icon">
                <FaRegBuilding />
              </div>
            </li>
          </Link>
          <Link to="/brokers-list">
            <li className="sideList">
              <p>Brokers</p>
              <div className="icon">
                <FaExchangeAlt />
              </div>
            </li>
          </Link>
          <Link to="/partners-list">
            <li className="sideList">
              <p>Partners</p>
              <div className="icon">
                <FaHandshake />
              </div>
            </li>
          </Link>
          <Link to="/agents-list">
            <li className="sideList">
              <p>Agents</p>
              <div className="icon">
                <HiUsers />
              </div>
            </li>
          </Link>
          <Link to="/individual-list">
            <li className="sideList">
              <p>Individual CDD</p>
              <div className="icon">
                <FaUserTie />
              </div>
            </li>
          </Link>

          <Link to="/individualkyc-list">
            <li className="sideList">
              <p>Individual KYC</p>
              <div className="icon">
                <FaUserAlt />
              </div>
            </li>
          </Link>

          {userRole === 'superAdmin' && (
            <Link to="/role-assignment">
              <li className="sideList">
                <p>User Management</p>
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
