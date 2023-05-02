import React,{useEffect,useState} from 'react'
import { collection, getDocs, deleteDoc,doc,query, onSnapshot,orderBy } from "firebase/firestore";
import { db } from "../../Components/firebaseConfig";
import { DataGrid } from "@mui/x-data-grid";
import { userColumns } from '../Contact/contactTableSource';
import SideBar from '../SideBar/SideBar';
import { useNavigate } from 'react-router-dom';
import { GridToolbarContainer } from "@mui/x-data-grid";
import { GridToolbarExport } from "@mui/x-data-grid";

const Contact = () => {

    const [data, setData] = useState([]);
    const navigate=useNavigate()

    // useEffect(()=> {
    //     const fetchData = async () =>{
    //       let list =[]
    //       try{
    //         const querySnapshot = await getDocs(collection(db,'contactForm'));
    //         querySnapshot.forEach((doc)=>{
    //           list.push({id: doc.id, ...doc.data()})
    //           console.log(doc.id, "=>", doc.data());
    //         })
    //         setData(list)
    //         console.log(list)
    //       } catch(err){
    //         console.log(err)
    //       }
    //     }
    //     fetchData()
    //   },[])
    //   console.log(data)
    useEffect(()=> {
      const dataRef = collection(db, 'contactForm')
      const q = query(dataRef, orderBy('createdAt', 'desc'));
      onSnapshot(q,(snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id:doc.id,
          ...doc.data(),
        }))
        setData(data);
        console.log(data)
      })
    },[])


      const handleDelete = async (id) => {
        try {
          await deleteDoc(doc(db, "contactForm", id));
          setData(data.filter((item) => item.id !== id));
        } catch (err) {
          console.log(err);
        }
      };

      const handleView = async (id) => {
        navigate('/contact/' + id)
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
    
              </div>
            );
          },
        },
      ];
      return (
        <div className='List' style={{marginTop:30}}>
        <div className="datatable">
          <div className="datatableTitle" style={{fontSize:25}}>
            Contact Us 
          </div>
          <DataGrid

          {...data}
          components={{
          Toolbar: CustomToolbar,
          }}
            autoHeight={true}
            className="datagrid"
            rows={data}
            columns={userColumns.concat(actionColumn)}
            pageSize={6}

          />
        </div>
        </div>

      );
}

export default Contact