import { createStore } from 'redux';

const initialState = {
  data: [],
  editData: [],
  editingKey: null,
};

function rootReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.data };
    case 'SET_EDIT_DATA':
      return { ...state, editData: action.data };
    case 'SET_EDITING_KEY':
      return { ...state, editingKey: action.key };
    default:
      return state;
  }
}

const store = createStore(rootReducer);

export default store;
