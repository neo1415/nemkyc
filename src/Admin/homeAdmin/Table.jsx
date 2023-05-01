import { DataGrid } from "@mui/x-data-grid";
import { userColumns} from "../Table/datatablesource";
import { Link } from "react-router-dom";
import { useState, useEffect,useContext } from "react";
import { GridToolbar } from "@mui/x-data-grid";
import { GridToolbarContainer } from "@mui/x-data-grid";
import { GridToolbarExport } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc,onSnapshot, orderBy, query } from "firebase/firestore";
import {auth, db } from "../../APi/index";
import { useAuthState } from 'react-firebase-hooks/auth';


const List = () => {
  const [data, setData] = useState([]);
  const [approved, setApproved] = useState(false);
  // const {currentUser} = useContext(AuthContext)
  const navigate=useNavigate()
 
    const [user] = useAuthState(auth)
  
  useEffect(()=> {
    const dataRef = collection(db, 'users')
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
      await deleteDoc(doc(db, "users", id));
      setData(data.filter((item) => item.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleView = async (id) => {
    navigate('/list/' + id)
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
    <div className="list" style={{marginLeft:'-4rem', marginRight:'-4rem',height:'55vh'}}>
      <div className="datatable" style={{height:'65vh'}}>
      <div className="datatableTitle" style={{fontSize:20}}>
        CV Review
      </div>
      <DataGrid

{...data}
  components={{
    Toolbar: CustomToolbar,
  }}

        className="datagrid"
        rows={data}
        columns={userColumns}
        pageSize={3}

      />
    </div>
    </div>

    
  );

};

export default List;

