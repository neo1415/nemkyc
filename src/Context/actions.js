import {
    SET_DATA,
    SET_FILTERED_DATA,
    SET_IS_LOADING,
    SET_MODAL_OPEN,
    SET_ID_TO_DELETE
  } from './actionTypes';
  
  export const setData = (data) => ({
    type: SET_DATA,
    data
  });
  
  export const setFilteredData = (filteredData) => ({
    type: SET_FILTERED_DATA,
    filteredData
  });
  
  export const setIsLoading = (isLoading) => ({
    type: SET_IS_LOADING,
    isLoading
  });
  
  export const setModalOpen = (modalOpen) => ({
    type: SET_MODAL_OPEN,
    modalOpen
  });
  
  export const setIdToDelete = (idToDelete) => ({
    type: SET_ID_TO_DELETE,
    idToDelete
  });