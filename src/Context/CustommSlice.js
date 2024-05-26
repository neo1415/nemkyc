import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  editData: [],
  editingKey: null,
};

const customSlice = createSlice({
  name: 'custom',
  initialState,
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    setEditData: (state, action) => {
      state.editData = action.payload;
    },
    setEditingKey: (state, action) => {
      state.editingKey = action.payload;
    },
  },
});

export const { setData, setEditData, setEditingKey } = customSlice.actions;
export default customSlice.reducer;
