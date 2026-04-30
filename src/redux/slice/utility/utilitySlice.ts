import type { destroySessionPropsTypes } from "@/components/common/DestroySession";
import type { rootStateType } from "@/redux/sotre";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type destroySessionParamsType = destroySessionPropsTypes

interface utilityStateType {
    showErrorBanner: true | false
    showInfoBanner: true | false
    bannerMessage: string | null
    showDestroySession: true | false
    destroySessionParams: destroySessionParamsType | null
}

// InitialState
const initialState: utilityStateType = {
    showErrorBanner: false,
    showInfoBanner: false,
    bannerMessage: null,
    showDestroySession: false,
    destroySessionParams: null
}

// Create slice
const utilitySlice = createSlice({
    name: "utility",
    initialState,
    reducers: {
        // Set Show Error Banner
        setShowErrorBanner: (state, action: PayloadAction<string>) => {
            state.showErrorBanner = true;
            state.showInfoBanner = false;
            state.bannerMessage = action.payload;
        },

        // Set Show Info Banner
        setShowInfoBanner: (state, action: PayloadAction<string>) => {
            state.showInfoBanner = true;
            state.showErrorBanner = false;
            state.bannerMessage = action.payload;
        },

        // Clear banner
        clearBanner: (state) => {
            state.showErrorBanner = false;
            state.showInfoBanner = false;
            state.bannerMessage = null;
        },

        // Set Show Destroy Session
        setShowDestroySession: (state, action: PayloadAction<boolean>) => {
            state.showDestroySession = action.payload
        },

        // Trigger Destroy Session
        triggerDestroySession: (state, action: PayloadAction<destroySessionParamsType>) => {
            state.showDestroySession = true
            state.destroySessionParams = action.payload
        },

        // Clear Destroy Session
        clearDestroySession: (state) => {
            state.showDestroySession = false
            state.destroySessionParams = null
        },

        // Reset utility states
        resetUtilityStates: () => initialState
    }
})

// Export Actions
export const { setShowErrorBanner, setShowInfoBanner, clearBanner, setShowDestroySession, triggerDestroySession, clearDestroySession, resetUtilityStates } = utilitySlice.actions;

// Export Reducer
export default utilitySlice;

// Selector
export const selectShowErrorBanner = (state: rootStateType) => state.utility.showErrorBanner
export const selectShowInfoBanner = (state: rootStateType) => state.utility.showInfoBanner
export const selectMessageBanner = (state: rootStateType) => state.utility.bannerMessage
export const selectShowDestroySession = (state: rootStateType) => state.utility.showDestroySession
export const selectDestroySessionParams = (state: rootStateType) => state.utility.destroySessionParams