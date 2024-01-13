import { DataGrid } from '@mui/x-data-grid';
import { UserColumns} from "../Individual/datatablesource";
import { useState, useEffect} from "react";
import { collection,onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../APi/index";

const Individual = () => {
  const [data, setData] = useState([]);

  useEffect(()=> {
    const dataRef = collection(db, 'individual-kyc')
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
    <div className="list ind"  style={{marginLeft:'-13rem',height:'50vh', width:'81%', position:"relative" ,overflow:'hidden'}}>
      <div className="datatable">
      <div className="datatableTitle">
        Individual KYC
      </div>
      <DataGrid
        className="datagrid"
        rows={data}
        columns={UserColumns}
        pageSize={2}
        rowsPerPageOptions={[2,5]}
    />
    </div>
  </div>

    
  );

};

export default Individual;

