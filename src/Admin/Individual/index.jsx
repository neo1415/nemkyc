import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { GridToolbarContainer } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { deleteDoc,doc } from "firebase/firestore";
import { db } from "../../APi/index";
import SideBar from "../SideBar/SideBar";
import { CircularProgress } from '@mui/material';
import { GridToolbarExport } from "@mui/x-data-grid";
import { UserAuth } from "../../Context/AuthContext";
import useAutoLogout from "../../Components/Timeout";
import { UserColumns } from "./datatablesource";
import axios from "axios";
import { endpoints } from "../Authentication/Points";
import ConfirmationModal from './../../Containers/Modals/ConfirmationModal';
import FilterComponent from '../../Components/useFilter';
import useFetchUserRole from './../../Components/checkUserRole';

function CustomLoadingOverlay() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <CircularProgress />
    </div>
  );
}

const Individual = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const navigate = useNavigate(); 
  const { user } = UserAuth();
  const userRole = useFetchUserRole(user);
  const { logout } = UserAuth();

  // Use the custom hook to implement automatic logout
  useAutoLogout({
    timeoutDuration: 10 * 60 * 1000 ,
    logout, // Use the logout function from context
    redirectPath: '/signin', // Specify the redirect path
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Set loading to true before fetching the data
      const response = await axios.get(endpoints.getIndividualData);
      
      if (response.status === 200) {
        setData(response.data);
        // console.log(response.data)
      } else {
        // console.error('Error fetching users:', response.statusText);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);
  

  const handleDelete = async () => {
    setModalOpen(false);
    if (idToDelete) {
      try {
        await deleteDoc(doc(db, "individual-kyc", idToDelete));
        setData(data.filter((item) => item.id !== idToDelete));
      } catch (err) {
        console.log(err);
      }
    }
  };
  
  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setModalOpen(true);
  };
  const handleView = async (id) => {
    navigate("/individual-list/" + id);
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
            {userRole ==='admin' && (
              <div
              className="deleteButton"
              onClick={() => handleDeleteClick(params.row.id)}
            >
              Delete
            </div>
            )}
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
    <div className="list">
      <SideBar />
      <div className="datatable">
        <div className="datatableTitle">Individual KYC
        <FilterComponent initialData={data} setFilteredData={setFilteredData} />
        </div>
        <DataGrid
        components={{
              Toolbar: CustomToolbar,
              LoadingOverlay: CustomLoadingOverlay,// Custom loading overlay
            }}
          className="datagrid"
          rows={filteredData}
          columns={actionColumn.concat(UserColumns)}
          pageSize={9}
          rowsPerPageOptions={[9]}
          checkboxSelection
          loading={isLoading} // Use the loading prop
        />
      </div>
      <ConfirmationModal
      open={modalOpen}
      title="Delete Entry"
      content="Are you sure you want to delete this entry?"
      onConfirm={handleDelete}
      onCancel={() => setModalOpen(false)}
    />
    </div>
  );
};

export default Individual;
