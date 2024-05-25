import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const FilterComponent = ({ initialData, setFilteredData, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const handleDateRangeChange = (date, isStartDate) => {
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
    if (activeFilter) {
      setActiveFilter(null);
      setSelectedDateRange([null, null]);
      setSearchTerm('');
      setFilteredData(initialData);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const selectFilterOption = (filterOption) => {
    setActiveFilter(filterOption);
    handleClose();
  };

  const parseDate = (formattedDate) => {
    const parts = formattedDate.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  useEffect(() => {
    let filtered = initialData;

    if (userRole === 'moderator') {
      filtered = filtered.filter(item => item.status === 'completed');
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

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
  }, [searchTerm, selectedDateRange, initialData, setFilteredData, userRole]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <Button onClick={handleClick}>
        {activeFilter ? 'Close Filter' : 'Filter'}
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
            InputLabelProps={{ shrink: true }}
            value={selectedDateRange[0] || ''}
            onChange={(e) => handleDateRangeChange(new Date(e.target.value), true)}
          />
          <TextField
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={selectedDateRange[1] || ''}
            onChange={(e) => handleDateRangeChange(new Date(e.target.value), false)}
          />
        </>
      )}
    </div>
  );
};

export default FilterComponent;
