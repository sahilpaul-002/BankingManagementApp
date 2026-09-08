import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { rootStateType } from '../../sotre'

// 🔐 Define State Type
export type portalType = 'admin' | 'business' | 'user'

export interface applicationHeaderItemsType {
  "agent-code": string | null;
  "subagent-code": string | null;
  "business-id": string | null;
  "program-id": string | null;
  "x-api-key": string | null;
  "authorization": string | null;
}

export interface dnsConfigDataType {
  domain_name: string;
  dashboard_name: string;
  prefund_flag: boolean;
  logo_url?: string | null;
  base_url_api: string;
  favicon?: string | null;
  add_card_allowed: boolean;
  crypto_allowed: boolean;
  slogan_line_1?: string | null;
  slogan_line_2?: string | null;
  logo?: string | null;
  currency_symbol: string;
  currency_name: string;
  currency_img: string;
  signup_required: boolean;
  // dns_x_api_key: string;
  portal_type: string;
  m2p_allowed: boolean;
  p2p_allowed: boolean;
  // accessToken: string
}

interface ConfigState {
  applicationHeaders: applicationHeaderItemsType | null
  dnsConfigData: dnsConfigDataType | null
}

// 🧠 Initial State
const initialState: ConfigState = {
  applicationHeaders: null,
  dnsConfigData: null,
}

// ⚙️ Create Slice
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // Set Application Headers
    setAppliationHeaders: (state, action: PayloadAction<applicationHeaderItemsType>) => {
      state.applicationHeaders = {
        ...state.applicationHeaders,
        ...action.payload,
      } as applicationHeaderItemsType;
    },

    // Set DNS Config Details
    setDnsConfigDetails: (state, action: PayloadAction<dnsConfigDataType>) => {
      state.dnsConfigData = action.payload
    },

    // Reset Config States
    resetConfigStates: () => initialState

  },
})

// 📤 Export actions
export const { setAppliationHeaders, setDnsConfigDetails, resetConfigStates } = configSlice.actions

// 📤 Export reducer
export default configSlice

// 📌 Selectors (best practice)
export const selectDnsConfigDetails = (state: rootStateType) => state.config.dnsConfigData
export const selectApplicaitonHeaders = (state: rootStateType) => state.config.applicationHeaders