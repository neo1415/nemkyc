import { DataGrid } from "@mui/x-data-grid";
import { userColumns} from "../Table/datatablesource";
import { useState, useEffect } from "react";
import { collection,onSnapshot, orderBy, query } from "firebase/firestore";
import {db } from "../../APi/index";

const List = () => {
  const [data, setData] = useState([]);
 
  
  useEffect(()=> {
    const dataRef = collection(db, 'corporate-kyc')
    const q = query(dataRef, orderBy('createdAt', 'desc'));
    onSnapshot(q,(snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id:doc.id,
        ...doc.data(),
      }))
      setData(data);
   
    })
  },[])


  return (
    <div className="list corp " style={{marginLeft:'-4rem', marginRight:'-4rem',height:'55vh', width:'81%', position:"relative",overflow:'hidden'}}>
      <div className="datatable" style={{height:'65vh'}}>
      <div className="datatableTitle" style={{fontSize:20}}>
        Corporate KYC
      </div>
      <DataGrid
        className="datagrid"
        rows={data}
        columns={userColumns}
        pageSize={4}
      />
    </div>
    </div>

    
  );

};

export default List;

