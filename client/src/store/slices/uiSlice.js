import { createSlice } from '@reduxjs/toolkit'
const uiSlice = createSlice({
  name: 'ui',
  initialState: { darkMode: localStorage.getItem('darkMode') === 'true', sidebarOpen: true },
  reducers: {
    toggleDark(state) { state.darkMode = !state.darkMode; localStorage.setItem('darkMode', state.darkMode); },
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; }
  }
})
export const { toggleDark, toggleSidebar } = uiSlice.actions
export default uiSlice.reducer
