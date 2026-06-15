import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { rootStateType } from '../../sotre'

// 🔐 Define State Type
interface UserDetails {
  _id: string | null
  full_name: string | null
  // agent_code: string | null
  // subagent_code: string | null
  // program_id: string | null
  // business_id: string | null
  // client_id: string | null
  email: string | null
  mobile_country_code: string | null
  mobile_country_name: string | null
  phone_number: string | null
  date_of_birth: string | null
  gender: string | null
  kyc_status: string | null
  // risk_category: string | null
  wallet_id: string | null
  status: string | null
  is_active: boolean | null
  is_email_verified: boolean | null
  is_phone_verified: boolean | null
  is_2fa_enabled: boolean | null
}

interface UserState {
  userDetails: UserDetails | null
  isAuthorized: boolean
  isAuthenticated: boolean
}

// 🧠 Initial State
const initialState: UserState = {
  userDetails: null,
  isAuthorized: false,
  isAuthenticated: false
}

// ⚙️ Create Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Set User Details
    setUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.userDetails = action.payload
    },

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
export const { setUserDetails, setAuthenticated, setAuthorized, logout, resetUserState } = userSlice.actions

// 📤 Export reducer
export default userSlice

// 📌 Selectors
export const selectUserDetails = (state: rootStateType) => state.user.userDetails
export const selectIsAuthenticated = (state: rootStateType) => state.user.isAuthenticated
export const selectIsAuthorized = (state: rootStateType) => state.user.isAuthorized