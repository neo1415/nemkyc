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
      const filteredData = data.filter((item) => {
        const createdAtDate = new Date(item.createdAt);
        return createdAtDate >= startDate && createdAtDate <= new Date(endDate.getTime() + 86400000); // Add one day (86400000 milliseconds) to include the end date
      });
      setFilteredData(filteredData);
    } else {
      setFilteredData(data);
    }
  }, [selectedDateRange, data]);

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
        rows={filteredData}
        columns={userColumns.concat(actionColumn)}
        pageSize={9}
        rowsPerPageOptions={[9]}
        checkboxSelection

      />
    </div>
    </div>

    
  );

};

export default List;

