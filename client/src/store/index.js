import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
export default configureStore({ reducer: { auth: authReducer, ui: uiReducer } })
