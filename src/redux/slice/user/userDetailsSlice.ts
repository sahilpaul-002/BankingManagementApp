import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../sotre'

// 🔐 Define State Type
interface UserDetails {
  token: string | null
  isAuthenticated: boolean
}

// 🧠 Initial State
const initialState: UserDetails = {
  token: null,
  isAuthenticated: false,
}

// ⚙️ Create Slice
const userDetailsSlice = createSlice({
  name: 'userDetails',
  initialState,
  reducers: {
    // ✅ Set Token
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
    },

    // ❌ Logout
    logout: (state) => {
      state.token = null
      state.isAuthenticated = false
    },
  },
})

// 📤 Export actions
export const { setToken, logout } = userDetailsSlice.actions

// 📤 Export reducer
export default userDetailsSlice.reducer

// 📌 Selectors (best practice)
export const selectToken = (state: RootState) => state..token
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated