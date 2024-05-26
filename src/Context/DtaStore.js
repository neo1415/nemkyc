import { configureStore, combineReducers } from '@reduxjs/toolkit';
import DataSlice from './DataSlice';
import UsersSlice from './UsersSlice';
import { customSlice } from './CustommSlice';

const rootReducer = combineReducers({
  data: DataSlice ,
  user: UsersSlice,
  custom: customSlice
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
