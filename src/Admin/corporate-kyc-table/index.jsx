import React, { useEffect,useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../APi/index';
import { DataGrid } from '@mui/x-data-grid';
import { GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid';
import CircularProgress from '@mui/material/CircularProgress';
import SideBar from '../SideBar/SideBar';
import ConfirmationModal from '../../Containers/Modals/ConfirmationModal';
import FilterComponent from '../../Components/useFilter';
import { UserAuth } from '../../Context/AuthContext';
import useAutoLogout from '../../Components/Timeout';
import useFetchUserRole from '../../Components/checkUserRole';
import { StatusButton } from '../../Components/StatusButton';
import { UserColumns } from './datatablesource';
import axios from 'axios';
import { endpoints } from '../Authentication/Points';
// import { 
//   setData,
//   setFilteredData,
//   setIsLoading,
//   setModalOpen,
//   setIdToDelete
// } from '../../Context/actions'; // Adjust the path to your actions file

import './Table.scss';

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

const CorporateKYCTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const navigate = useNavigate(); 
  const { user } = UserAuth();
  const userRole = useFetchUserRole(user);
  const { logout } = UserAuth(); 

  // const dispatch = useDispatch();
  // const navigate = useNavigate();
  // const { user } = UserAuth();
  // const userRole = useFetchUserRole(user);
  // const { logout } = UserAuth();

  // Use the custom hook to implement automatic logout
  useAutoLogout({
    timeoutDuration: 10 * 60 * 1000, // Adjust as needed
    logout, // Use the logout function from context
    redirectPath: '/signin', // Specify the redirect path
  });

  // Access state from the Redux store
  // const data = useSelector(state => state.data);
  // const filteredData = useSelector(state => state.filteredData);
  // const isLoading = useSelector(state => state.isLoading);
  // const modalOpen = useSelector(state => state.modalOpen);
  // const idToDelete = useSelector(state => state.idToDelete);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Set loading to true before fetching the data
      const response = await axios.get(endpoints.getCorporateKYCData);
      
      if (response.status === 200) {
        const data = response.data;
        // Filter out items with status 'processing' if user role is not 'admin'
        const filtered = userRole === 'admin' ? data : data.filter(item => item.status !== 'processing');
        setData(filtered);
        setFilteredData(filtered);
      } else {
        console.error('Error fetching users:', response.statusText);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [userRole]);

  const handleDelete = async () => {
    setModalOpen(false);
    if (idToDelete) {
      try {
        await deleteDoc(doc(db, "corporate-kyc-form", idToDelete));
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

  const handleView = (id) => {
    navigate('/corporatekyc-list/' + id);
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
      field: 'action',
      headerName: 'Action',
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
                  <StatusButton id={id} collection="corporate-kyc-form" setData={setData} />
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
        <div className="datatableTitle">
          CORPORATE KYC FORM
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

export default CorporateKYCTable;
