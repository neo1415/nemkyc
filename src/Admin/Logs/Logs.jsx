import React, { useState, useEffect } from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from '../../Containers/Modals/ConfirmationModal';
import { csrfProtectedGet, csrfProtectedDelete } from '../../Components/CsrfUtils';
import Sidebar from '../SideBar/SideBar';

const LogsTable = ({ userRole }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const navigate = useNavigate();
  const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);

      const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      const logsEndpoint = `${serverURL}/logs`;

      try {
        const response = await axios.fetch(logsEndpoint);
        if (response.status === 200) {
          const logs = response.data.logs.map((log, index) => ({
            id: index,
            ...log,
          }));
          setData(logs);
          setFilteredData(logs);
        } else {
          console.error('Error fetching logs:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
      setIsLoading(false);
    };

    fetchLogs();
  }, []);

  const handleDelete = async () => {
    setModalOpen(false);
    if (idToDelete !== null) {
      try {
        await axios.delete(`${serverURL}/logs/${idToDelete}`);
        setData(data.filter((item) => item.id !== idToDelete));
        setFilteredData(filteredData.filter((item) => item.id !== idToDelete));
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
    navigate(`/logs/${id}`);
  };

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  }

  const columns = [
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
                  <div className="viewButton" onClick={() => handleView(id)}>
                    View
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    { field: 'date', headerName: 'Date', width: 200 },
    { field: 'ip', headerName: 'IP Address', width: 150 },
    { field: 'request', headerName: 'Request', width: 300 },
    { field: 'statusCode', headerName: 'Status Code', width: 100 },
    { field: 'responseSize', headerName: 'Response Size', width: 150 },
    { field: 'referer', headerName: 'Referer', width: 250 },
    { field: 'userAgent', headerName: 'User Agent', width: 500 },
   
  ];

  return (
    <div className="list">
      <Sidebar />
      <div className="datatable">
        <div className="datatableTitle">Server Logs</div>
        <DataGrid
          components={{
            Toolbar: CustomToolbar,
            LoadingOverlay: () => (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress />
              </div>
            ),
          }}
          className="datagrid"
          columns={columns}
          rows={filteredData}
          pageSize={8}
          rowsPerPageOptions={[9]}
          checkboxSelection
          loading={isLoading}
        />
      </div>
      <ConfirmationModal
        open={modalOpen}
        title="Delete Log Entry"
        content="Are you sure you want to delete this log entry?"
        onConfirm={handleDelete}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default LogsTable;
