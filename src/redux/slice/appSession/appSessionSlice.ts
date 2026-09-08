import { createSlice } from "@reduxjs/toolkit";

interface AppSessionStateType {
    isLoggingOut: boolean;
}

const initialState: AppSessionStateType = {
    isLoggingOut: false,
};

const appSessionSlice = createSlice({
    name: "appSession",
    initialState,
    reducers: {
        startLogout: (state) => {
            state.isLoggingOut = true;
        },

        finishLogout: (state) => {
            state.isLoggingOut = false;
        },
    },
});

export const {
    startLogout,
    finishLogout,
} = appSessionSlice.actions;

export default appSessionSlice;