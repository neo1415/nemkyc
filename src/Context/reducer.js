// reducer.js
import {
  SET_DATA,
  SET_FILTERED_DATA,
  SET_IS_LOADING,
  SET_MODAL_OPEN,
  SET_ID_TO_DELETE,
  SET_EDIT_DATA,
  SET_EDITING_KEY
} from './actionTypes';

const initialState = {
  data: [],
  filteredData: [],
  isLoading: false,
  modalOpen: false,
  idToDelete: null,
  editData: {}, // Add this
  editingKey: null // Add this
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
    case SET_EDIT_DATA:
      return { ...state, editData: action.data }; // Add this case
    case SET_EDITING_KEY:
      return { ...state, editingKey: action.key }; // Add this case
    default:
      return state;
  }
};

export default rootReducer;
