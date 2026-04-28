import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { rootStateType } from '../../sotre'

// 🔐 Define State Type
export type portalType = 'admin' | 'business' | 'user'

export interface applicationHeaderItemsType {
  "agent-code": string;
  "subagent-code": string;
  "business-id": string;
  "program-id": string;
  "client-id": string;
  "x-api-key": string;
  "authorization": string
}

export interface dnsConfigDataType {
  domain_name: string;
  // agent_code: string;
  // subagent_code: string;
  // business_id: string;
  dashboard_name: string;
  // program_id: string;
  prefund_flag: boolean;
  // client_id: string;
  // x_api_key: string;
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
      state.applicationHeaders = action.payload
    },
    // Set DNS Config Details
    setDnsConfigDetails: (state, action: PayloadAction<dnsConfigDataType>) => {
      state.dnsConfigData = action.payload
    },

  },
})

// 📤 Export actions
export const { setAppliationHeaders, setDnsConfigDetails } = configSlice.actions

// 📤 Export reducer
export default configSlice

// 📌 Selectors (best practice)
export const selectDnsConfigDetails = (state: rootStateType) => state.config.dnsConfigData
export const selectApplicaitonHeaders = (state: rootStateType) => state.config.applicationHeaders