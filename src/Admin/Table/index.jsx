import { DataGrid } from '@mui/x-data-grid';
import { userColumns} from "../Table/datatablesource";
import { useState, useEffect} from "react";
import './Table.scss'
import {GridToolbarContainer} from '@mui/x-data-grid';
import { GridToolbarExport } from "@mui/x-data-grid";
import { UserAuth } from '../../Context/AuthContext';
import { useNavigate } from "react-router-dom";
import { deleteDoc,getDoc,doc } from "firebase/firestore";
import { db } from "../../APi/index";
import { CircularProgress } from '@mui/material';
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SideBar from "../SideBar/SideBar";
import useAutoLogout from '../../Components/Timeout';
import axios from "axios";
import { endpoints } from '../Authentication/Points';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

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

const List = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
const [activeFilter, setActiveFilter] = useState(null);
const [anchorEl, setAnchorEl] = useState(null);

  const navigate = useNavigate(); 
  const { user } = UserAuth();
  const [userRole, setUserRole] = useState('');
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(db, 'userroles', user.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().role);
        }
      }
    };
  
    fetchUserRole();
  }, [user]);

  const { logout } = UserAuth(); // Replace UserAuth with your authentication context

  // Use the custom hook to implement automatic logout
  useAutoLogout({
    timeoutDuration: 10 * 60 * 1000, // (adjust as needed)
    logout, // Use the logout function from your context
    redirectPath: '/signin', // Specify the redirect path
  });

  // Function to handle the date range change
  const handleDateRangeChange = (date, isStartDate) => {
    // Convert the date to YYYY-MM-DD format for the input
    const formattedDate = date ? date.toISOString().split('T')[0] : null;
    setSelectedDateRange((prevDates) => {
      if (isStartDate) {
        return [formattedDate, prevDates[1]];
      } else {
        return [prevDates[0], formattedDate];
      }
    });
  };
  
  
  const handleClick = (event) => {
    if (showFilterOptions || activeFilter) {
      // Reset filters when closing the filter options
      setActiveFilter(null);
      setSelectedDateRange([null, null]);
      setSearchTerm('');
      setShowFilterOptions(false);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
  

const handleClose = () => {
  setAnchorEl(null);
};

const selectFilterOption = (filterOption) => {
  setActiveFilter(filterOption);
  setShowFilterOptions(false); // Close the filter options menu
  handleClose(); // Close the menu
};

  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Set loading to true before fetching the data
      const response = await axios.get(endpoints.getCorporateData);
      
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
  
  //date filter
  useEffect(() => {
    let filtered = data;
  
    // Apply search filter if search is active
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
     // Apply date range filter if dates are selected
      const [startDate, endDate] = selectedDateRange;
      if (startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

        filtered = filtered.filter((item) => {
          const createdAtDate = parseDate(item.createdAt);
          return createdAtDate >= new Date(startDate) && createdAtDate < adjustedEndDate;
        });
      }
          setFilteredData(filtered);
  }, [selectedDateRange, data, searchTerm]);   

  // Function to parse formatted date into JavaScript Date object
    const parseDate = (formattedDate) => {
      const parts = formattedDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day); // Return a JavaScript Date object
    };


  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "corporate-kyc", id));
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
            {userRole ==='admin' && (
              <div
                className="deleteButton"
                onClick={() => handleDelete(params.row.id)}
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
      <div className="datatableTitle">
        Corporate KYC
        <div className="searchAndFilter">
          <Button onClick={handleClick}>
            {showFilterOptions || activeFilter ? 'Close Filter' : 'Filter'}
          </Button>
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => selectFilterOption('search')}>Search</MenuItem>
            <MenuItem onClick={() => selectFilterOption('dateRange')}>Date Range</MenuItem>
          </Menu>
          {activeFilter === 'search' && (
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          {activeFilter === 'dateRange' && (
       <>
          <TextField
          label="Start Date"
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          value={selectedDateRange[0] || ''}
          onChange={(e) => handleDateRangeChange(new Date(e.target.value), true)}
        />
        <TextField
          label="End Date"
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          value={selectedDateRange[1] || ''}
          onChange={(e) => handleDateRangeChange(new Date(e.target.value), false)}
        />

          </>
        )}

        </div>
      </div>
          <DataGrid
            components={{
              Toolbar: CustomToolbar,
              LoadingOverlay: CustomLoadingOverlay,// Custom loading overlay
            }}
            className="datagrid"
            columns={actionColumn.concat(userColumns)}
            rows={filteredData}
            pageSize={8}
            rowsPerPageOptions={[9]}
            checkboxSelection
            loading={isLoading} // Use the loading prop
          />
    </div>
    </div>
    
  );

};

export default List;

