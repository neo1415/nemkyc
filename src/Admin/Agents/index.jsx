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
import ConfirmationModal from '../../Containers/Modals/ConfirmationModal';
import FilterComponent from '../../Components/useFilter';
import useFetchUserRole from '../../Components/checkUserRole';
import { StatusButton } from "../../Components/StatusButton";
import { fetchData, deleteData } from '../../Context/DataSlice';
import { useDispatch, useSelector } from 'react-redux';

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

const AgentsList = () => {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.data.data);
  const isLoading = useSelector((state) => state.data.isLoading);
  const userRole = useFetchUserRole(UserAuth().user);
  const [filteredData, setFilteredData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const navigate = useNavigate(); 

  const { logout } = UserAuth();

  // Use the custom hook to implement automatic logout
  useAutoLogout({
    timeoutDuration: 10 * 60 * 1000 ,
    logout, // Use the logout function from context
    redirectPath: '/signin', // Specify the redirect path
  });

  useEffect(() => {
    if (data.length === 0) {
      dispatch(fetchData({ endpoint: endpoints.getAgentsData, role: userRole }));
    } else {
      setFilteredData(data);
    }
  }, [data, dispatch, userRole]);

  const handleDelete = async () => {
    setModalOpen(false);
    if (idToDelete) {
      dispatch(deleteData({ endpoint: 'http://localhost:3001/delete/agents-kyc', id: idToDelete }));
    }
  };
  
  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setModalOpen(true);
  };
  const handleView = async (id) => {
    navigate("/agents-list/" + id);
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
      renderCell: (params) => {
        const { id } = params.row;
        return (
          <div className="cellAction">
            {userRole === 'admin' && (
              <>
                <div className="deleteButton" onClick={() => handleDeleteClick(id)}>
                  Delete
                </div>
                <div className="statusButton">
                  <StatusButton id={id} collection="agents-kyc" setData={setFilteredData} />
                </div>
              </>
            )}
            <div className="viewButton" onClick={() => handleView(id)}>
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
        <div className="datatableTitle">Agents KYC
        <FilterComponent initialData={data} setFilteredData={setFilteredData} />
        </div>
        <DataGrid
          components={{
            Toolbar: CustomToolbar,
            LoadingOverlay: CustomLoadingOverlay,
          }}
          className="datagrid"
          columns={actionColumn.concat(UserColumns)}
          rows={filteredData}
          pageSize={8}
          rowsPerPageOptions={[9]}
          checkboxSelection
          loading={isLoading}
          getRowClassName={(params) =>
            `row-${params.row.status}`
          }
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

export default AgentsList;
