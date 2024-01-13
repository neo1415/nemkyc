import React,{useEffect} from 'react'
import './Widget.scss'
import { HiArrowCircleUp, HiArrowCircleDown, HiUser, HiUsers } from 'react-icons/hi'
import { query, where, collection, getDocs, } from 'firebase/firestore';
import { db } from '../../APi/index'
import { useState } from 'react';
import { Link } from 'react-router-dom'

const Widget = ({type}) => {

  const [amount, setAmount] = useState(null)
  const [diff, setDiff] = useState(null)
  const [money, setMoney] = useState(null)


let data;

switch(type){
  case 'user':
    data={
      title:'Corporate-kyc',
      query: 'corporate-kyc',
      link:'see all Users',
      icon: <HiUsers className='icon' />,
      to:'/list'
    };
    break;

    case 'basic':
    data={
      title:'Individual-kyc',
      query: 'individual-kyc',
      link:'View all Customers',
      icon: <HiUser className='icon' />,
      to:'/individual-list'
    };
    break;
    default:
    break;
}

useEffect(() => {
  const fetchData = async () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1);

    const lastMonthQuery = query(
      collection(db, data.query),
      where("timestamp", ">=", lastMonth),
      where("timestamp", "<", today)
    );
    const prevMonthQuery = query(
      collection(db, data.query),
      where("timestamp", ">=", prevMonth),
      where("timestamp", "<", lastMonth)
    );

    const lastMonthDocs = await getDocs(lastMonthQuery);
    const prevMonthDocs = await getDocs(prevMonthQuery);

    const thisMonthAmount = lastMonthDocs.size;
    const lastMonthAmount = lastMonthDocs.size;
    const prevMonthAmount = prevMonthDocs.size;

    setMoney((thisMonthAmount * 1000).toLocaleString("en-US"));
    setAmount(lastMonthAmount);

    if (prevMonthAmount !== 0) {
      const diff = ((lastMonthAmount - prevMonthAmount) / prevMonthAmount) * 100;
      setDiff(parseFloat(diff.toFixed(1)));
    } else {
      setDiff(0);
    }
  };
  fetchData();
}, []);



  return (
    <div className='widget'>
        <div className='left'>
            <span className='titler'>{data.title}</span>
            <span className='counter'> {amount}</span>
            <Link to={data.to}><span className='link'>{data.link}</span></Link>
        </div>
        <div className='right'>
        <div className={`percentage ${diff < 0 ? "negative" : "positive"}`}>
          {diff < 0 ? <HiArrowCircleDown/> : <HiArrowCircleUp/> }
          {diff} %
        </div>
            {data.icon}
        </div>
    </div>
  )
}

export default Widget