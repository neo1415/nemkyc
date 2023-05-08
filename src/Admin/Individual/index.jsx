import { DataGrid } from '@mui/x-data-grid';
import { UserColumns} from "./datatablesource";
// import { Link } from "react-router-dom";
import { useState, useEffect,useContext } from "react";
import './Table.scss'
// import { GridToolbar } from "@mui/x-data-grid";
import {GridToolbarContainer} from '@mui/x-data-grid';
import { GridToolbarExport } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc,onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../APi/index";
// import {AuthContext} from '../../Context/AuthContext'
import SideBar from "../SideBar/SideBar";
// import Status from "./Status";



const Individual = () => {
  const [data, setData] = useState([]);
  // const {currentUser} = useContext(AuthContext)
  const navigate=useNavigate()
 
  
  
  useEffect(()=> {
    const dataRef = collection(db, 'individuals')
    const q = query(dataRef, orderBy('createdAt', 'desc'));
    onSnapshot(q,(snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id:doc.id,
        ...doc.data(),
      }))
      setData(data);
   
    })
  },[])
  console.log(data)

// const approve = async (id) => {
//   try{
//     setApproved(true)
//   }
// }

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "individuals", id));
      setData(data.filter((item) => item.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleView = async (id) => {
    navigate('//individual-list/' + id)
  };

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  }
  

  const actionColumn = [
    {
      field: "action",
      headerName: "Action",
      width: 200,
      renderCell: (params, id) => {
        return (
          <div className="cellAction">
            {/* <Link to={"/adminid/" + id} style={{ textDecoration: "none" }}>
              <div className="viewButton">View</div>
            </Link> */}
            <div
              className="deleteButton"
              onClick={() => handleDelete(params.row.id)}
            >
              Delete
            </div>
            <div
              className="viewButton"
              onClick={() => handleView(params.row.id)}
            >
              View
            </div>

            <div>
            
           
           </div>
      
          </div>
        );
      },
    },
  ];
  return (
    <div className="list">
        <SideBar />
      <div className="datatable">
      <div className="datatableTitle">
        Individual KYC
      </div>
      <DataGrid

{...data}
  components={{
    Toolbar: CustomToolbar,
  }}

        className="datagrid"
        rows={data}
        columns={UserColumns.concat(actionColumn)}
        pageSize={9}
        rowsPerPageOptions={[9]}
        checkboxSelection

      />
    </div>
    </div>

    
  );

};

export default Individual;

