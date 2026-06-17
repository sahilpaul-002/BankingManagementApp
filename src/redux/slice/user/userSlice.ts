import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { rootStateType } from '../../sotre'

// 🔐 Define State Type
export interface UserDetailsType {
  fullName: string | null
  email: string | null
  mobileCountryCode: string | null
  mobileCountryName: string | null
  phoneNumber: string | null
  dob: string | null
  gender: string | null
  kycStatus: string | null
  isEmailVerified: boolean | null
  is2faEnabled: boolean | null
  twoFaType: "SMS-OTP"| "EMAIL-OTP" | "TOTP" | null
  authenticatorSecret: string | null
}

interface UserState {
  userDetails: UserDetailsType | null
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
    setUserDetails: (state, action: PayloadAction<UserDetailsType>) => {
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