import type { rootStateType } from "@/redux/sotre";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface utilityStateType {
    showErrorBanner: true | false
    showInfoBanner: true | false
    showDestroySession: true | false
}

// InitialState
const initialState: utilityStateType = {
    showErrorBanner: false,
    showInfoBanner: false,
    showDestroySession: false
}

// Create slice
const utilitySlice = createSlice({
    name: "utility",
    initialState,
    reducers: {
        // Set Show Error Banner
        setShowErrorBanner: (state, action: PayloadAction<boolean>) => {
            state.showErrorBanner = action.payload
        },

        // Set Show Info Banner
        setShowInfoBanner: (state, action: PayloadAction<boolean>) => {
            state.showInfoBanner = action.payload
        },

        // Set Show Destroy Session
        setShowDestroySession: (state, action: PayloadAction<boolean>) => {
            state.showDestroySession = action.payload
        }
    }
})

// Export Actions
export const {setShowErrorBanner, setShowInfoBanner, setShowDestroySession} = utilitySlice.actions;

// Export Reducer
export default utilitySlice;

// Selector
export const selectShowErrorBanner = (state: rootStateType) => state.utility.showErrorBanner