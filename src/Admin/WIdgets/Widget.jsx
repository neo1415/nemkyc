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
      title:'Corporate',
      query: 'users',
      link:'see all Users',
      icon: <HiUser className='icon' />,
      to:'/list'
    };
    break;

    case 'basic':
    data={
      title:'Individuals',
      query: 'individuals',
      link:'View all Customers',
      icon: <HiUsers className='icon' />,
      to:'/individual-list'
    };
    break;
    default:
    break;
}

useEffect(() => {
  const fetchData = async () => {
    const today = new Date(new Date());
    const lastMonth = new Date(new Date().setMonth(today.getMonth() - 1));
    const prevMonth = new Date(new Date().setMonth(today.getMonth() - 2));
    const thisMonth = new Date(new Date().setMonth(today.getMonth()));

    const lastMonthQuery = query(
      collection(db, data.query),
      where("timestamp", "<=", today),
      where("timestamp", ">", lastMonth)
    );
    const prevMonthQuery = query(
      collection(db, data.query),
      where("timestamp", "<=", lastMonth),
      where("timestamp", ">", prevMonth)
    );

    const thisMonthQuery = query(
      collection(db, data.query),
      where("timestamp", "<=", thisMonth),
      where("timestamp", ">", prevMonth)
    );

    const lastMonthData = await getDocs(lastMonthQuery);
    const prevMonthData = await getDocs(prevMonthQuery);
    const thisMonthData = await getDocs(thisMonthQuery);

    setMoney(((thisMonthData.docs.length)*1000).toLocaleString("en-US") )

    setAmount(lastMonthData.docs.length);
    setDiff(
      ((lastMonthData.docs.length - prevMonthData.docs.length) / prevMonthData.docs.length) *
        100
    );
    console.log(amount)
    console.log(diff)
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