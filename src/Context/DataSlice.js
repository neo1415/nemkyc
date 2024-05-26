import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { csrfProtectedDelete, csrfProtectedGet } from '../Components/CsrfUtils';


const initialState = {
  data: [],
  isLoading: false,
  error: null,
};

export const fetchData = createAsyncThunk(
  'data/fetchData',
  async ({ endpoint, role }) => {
    const response = await csrfProtectedGet(endpoint);
    if (response.status === 200) {
      return role === 'admin' ? response.data : response.data.filter(item => item.status !== 'processing');
    }
    throw new Error(response.statusText);
  }
);

export const deleteData = createAsyncThunk(
  'data/deleteData',
  async ({ endpoint, id }) => {
    await csrfProtectedDelete(`${endpoint}/${id}`);
    return id;
  }
);

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(deleteData.fulfilled, (state, action) => {
        state.data = state.data.filter((item) => item.id !== action.payload);
      });
  },
});

export default dataSlice.reducer;
