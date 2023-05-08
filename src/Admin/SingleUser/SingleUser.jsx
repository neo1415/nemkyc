import React,{useEffect, useState} from 'react'
// import './SingleUser.scss'
import { collection, getDocs, deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from '../../APi/index';
import { list } from 'firebase/storage';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { HiDownload } from 'react-icons/hi';
// import Status from '../Table/Status';
// import Status from './../Table/Status';

const SingleUser = () => {

    const [data, setData] = useState([]);

    const {id} = useParams();

    const style={
        size:30,
        color:'white'
    }

    useEffect(
        ()=>{
            const docRef = doc(db, 'users', id);
            onSnapshot(docRef, (snapshot) =>{
                setData({...snapshot.data(), id:snapshot.id});
            })
         
        }
        
    )
 


  return (
    <div className='singles'>
    <div className='file-download'>
    <a href={data.file}>Download File <HiDownload style={style} /> </a>
    </div>
        <p>Email : {data.email}</p>
        <p>Status: {data.cars}</p>
        {/* <Status data={data} id={id} /> */}
    </div>
    
  )
}

export default SingleUser