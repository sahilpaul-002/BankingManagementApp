import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { rootStateType } from '../../sotre'

// 🔐 Define State Type
interface UserState {
  isAuthorized: boolean
  isAuthenticated: boolean
}

// 🧠 Initial State
const initialState: UserState = {
  isAuthorized: false,
  isAuthenticated: false
}

// ⚙️ Create Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Set Authenticated
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },

    // Set Authorized
    setAuthorized: (state, action: PayloadAction<boolean>) => {
      state.isAuthorized = action.payload
    },

    // ❌ Logout
    logout: (state) => {
      state.isAuthorized = false
      state.isAuthenticated = false
    },

    // Reset User States 
    resetUserState: () => initialState
  },
})

// 📤 Export actions
export const { setAuthenticated, setAuthorized, logout, resetUserState } = userSlice.actions

// 📤 Export reducer
export default userSlice

// 📌 Selectors
export const selectIsAuthenticated = (state: rootStateType) => state.user.isAuthenticated
export const selectIsAuthorized = (state: rootStateType) => state.user.isAuthorized