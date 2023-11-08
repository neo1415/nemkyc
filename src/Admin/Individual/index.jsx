import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { GridToolbarContainer } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../APi/index";
import SideBar from "../SideBar/SideBar";
import { GridToolbarExport } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { UserAuth } from "../../Context/AuthContext";
import useAutoLogout from "../../Components/Timeout";

import { UserColumns } from "./datatablesource";

const Individual = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const navigate = useNavigate();

  const { logout } = UserAuth(); // Replace UserAuth with your authentication context

  // Use the custom hook to implement automatic logout
  useAutoLogout({
    timeoutDuration: 10 * 60 * 1000 ,
    logout, // Use the logout function from context
    redirectPath: '/signin', // Specify the redirect path
  });

  useEffect(() => {
    const dataRef = collection(db, "individuals");

    let q = query(dataRef, orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(data);
    });
  }, []);

  //date filter
  useEffect(() => {
    const [startDate, endDate] = selectedDateRange;
  
    if (startDate && endDate) {
      // Adjust the end date to include the entire day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
  
      const filteredData = data.filter((item) => {
        const createdAtDate = parseDate(item.createdAt);
        return createdAtDate >= startDate && createdAtDate <= adjustedEndDate; // Use < instead of <=
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

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "individuals", id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleView = async (id) => {
    navigate("/individual-list/" + id);
  };

  const handleFilterApply = () => {
    // Update the data based on selected date range
    setIsFilterApplied(true);
    setSelectedDateRange(selectedDateRange);
  };

  const handleClearFilter = () => {
    setIsFilterApplied(false);
    setSelectedDateRange([null, null]);
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
        <div className="datatableTitle">Individual KYC</div>
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
        <DataGrid
      components={{
      Toolbar: CustomToolbar,
      }}
          className="datagrid"
          rows={filteredData}
          columns={actionColumn.concat(UserColumns)}
          pageSize={9}
          rowsPerPageOptions={[9]}
          checkboxSelection
        />
      </div>
    </div>
  );
};

export default Individual;
