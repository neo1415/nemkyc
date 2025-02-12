import React, { useEffect, useState } from 'react';
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
import { UserColumns } from './datatablesource';
import { endpoints } from '../Authentication/Points';
import './Table.scss';
import { csrfProtectedGet } from '../../Components/CsrfUtils';

function CustomLoadingOverlay() {
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </div>
  );
}

const IndividualKYCTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const navigate = useNavigate(); 
  const { user } = UserAuth();
  const userRole = useFetchUserRole(user);
  const { logout } = UserAuth(); 

  useAutoLogout({
    timeoutDuration: 10 * 60 * 1000,
    logout,
    redirectPath: '/signin',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await csrfProtectedGet(endpoints.getIndividualKYCData);
        if (response.status === 200) {
          setData(response.data);
          setFilteredData(response.data);
        } else {
          console.error('Error fetching individual KYC data:', response.statusText);
        }
      } catch (err) {
        console.error('Error fetching individual KYC data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async () => {
    setModalOpen(false);
    if (idToDelete) {
      try {
        await deleteDoc(doc(db, 'Individual-kyc-form', idToDelete));
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
    navigate('/individualkyc-list/' + id);
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
          INDIVIDUAL KYC FORM
          <FilterComponent initialData={data} setFilteredData={setFilteredData} />
        </div>
        <DataGrid
          components={{ Toolbar: CustomToolbar, LoadingOverlay: CustomLoadingOverlay }}
          className="datagrid"
        columns={actionColumn.concat(UserColumns)}
          rows={filteredData}
          pageSize={8}
          rowsPerPageOptions={[9]}
          checkboxSelection
          loading={isLoading}
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

export default IndividualKYCTable;
