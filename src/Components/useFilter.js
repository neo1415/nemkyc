// useFilter.js
import { useState, useEffect } from 'react';

const useFilter = (initialData) => {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [filteredData, setFilteredData] = useState(initialData);

  // Function to parse formatted date into JavaScript Date object
  const parseDate = (formattedDate) => {
    const parts = formattedDate.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Function to handle the date range change
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

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    selectedDateRange,
    handleDateRangeChange,
    setData, // Expose setData so the component using the hook can update the data
  };
};

export default useFilter;
