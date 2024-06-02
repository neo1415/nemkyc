// reducer.js
import {
    SET_DATA,
    SET_FILTERED_DATA,
    SET_IS_LOADING,
    SET_MODAL_OPEN,
    SET_ID_TO_DELETE
  } from './actionTypes';
  
  const initialState = {
    data: [],
    filteredData: [],
    isLoading: false,
    modalOpen: false,
    idToDelete: null
  };
  
  const rootReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_DATA:
        return { ...state, data: action.data };
      case SET_FILTERED_DATA:
        return { ...state, filteredData: action.filteredData };
      case SET_IS_LOADING:
        return { ...state, isLoading: action.isLoading };
      case SET_MODAL_OPEN:
        return { ...state, modalOpen: action.modalOpen };
      case SET_ID_TO_DELETE:
        return { ...state, idToDelete: action.idToDelete };
      default:
        return state;
    }
  };
  
  export default rootReducer;
  