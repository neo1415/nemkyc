import { DataGrid } from '@mui/x-data-grid';
import { userColumns} from "../Table/datatablesource";
import { useState, useEffect} from "react";
import './Table.scss'
import {GridToolbarContainer} from '@mui/x-data-grid';
import { GridToolbarExport } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc,onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../APi/index";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import SideBar from "../SideBar/SideBar";


const List = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const navigate = useNavigate(); 
  
  useEffect(() => {
    const dataRef = collection(db, "users");

    let q = query(dataRef, orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(data);
    });
  }, []);

  
useEffect(() => {
  const [startDate, endDate] = selectedDateRange;

  if (startDate && endDate) {
    // Adjust the end date to include the entire day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

    const filteredData = data.filter((item) => {
      const createdAtDate = parseDate(item.createdAt);
      return createdAtDate >= startDate && createdAtDate < adjustedEndDate; // Use < instead of <=
    });
    setFilteredData(filteredData);
  } else {
    setFilteredData(data);
  }
}, [selectedDateRange, data]);

  
  // Function to parse formatted date into JavaScript Date object
  const parseDate = (formattedDate) => {
    const parts = formattedDate.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };
  

  const handleFilterButtonAction = () => {
    if (isDateFilterActive) {
      handleClearFilter();
    } else {
      handleFilterApply();
    }
    setIsDateFilterActive(!isDateFilterActive);
  };

  const handleFilterApply = () => {
    setIsFilterApplied(true);
    setSelectedDateRange(selectedDateRange);
  };

  const handleClearFilter = () => {
    setIsFilterApplied(false);
    setSelectedDateRange([null, null]);
  };

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
    <div className="list">
        <SideBar />
      <div className="datatable">
      <div className="datatableTitle">
        Corporate KYC
                <div className="dateRangePicker">
          <Grid container spacing={2} alignItems="center">
            {isDateFilterActive && (
              <>
                <Grid item xs={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={selectedDateRange[0] ? selectedDateRange[0].toISOString().split('T')[0] : ""}
                    onChange={(e) =>
                      setSelectedDateRange([e.target.value ? new Date(e.target.value) : null, selectedDateRange[1]])
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={selectedDateRange[1] ? selectedDateRange[1].toISOString().split('T')[0] : ""}
                    onChange={(e) =>
                      setSelectedDateRange([selectedDateRange[0], e.target.value ? new Date(e.target.value) : null])
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleFilterButtonAction}>
                {isDateFilterActive ? "Clear Filter" : "Date Filter"}
              </Button>
            </Grid>
          </Grid>
        </div>
      </div>
      <DataGrid
      components={{
      Toolbar: CustomToolbar,
      }}
        className="datagrid"
        columns={actionColumn.concat(userColumns)}
        rows={filteredData}
     
        pageSize={9}
        rowsPerPageOptions={[9]}
        checkboxSelection

      />
    </div>
    </div>

    
  );

};

export default List;

