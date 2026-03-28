import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../sotre'

// 🔐 Define State Type
export type portalType = 'admin' | 'business' | 'user'

export interface DnsConfigData {
    domain_name: string;
    agent_code: string;
    subagent_code: string;
    business_id: string;
    dashboard_name: string;
    program_id: string;
    prefund_flag: boolean;
    client_id: string;
    x_api_key: string;
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
    dns_x_api_key: string;
    portal_type: string;
    m2p_allowed: boolean;
    p2p_allowed: boolean;
    accessToken: string
}

interface ConfigState {
  dnsConfigData: DnsConfigData | null
}

// 🧠 Initial State
const initialState: ConfigState = {
  dnsConfigData: null,
}

// ⚙️ Create Slice
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // Set User Details
    setDnsConfigDetails: (state, action: PayloadAction<DnsConfigData>) => {
      state.dnsConfigData = action.payload
    },

  },
})

// 📤 Export actions
export const { setDnsConfigDetails} = configSlice.actions

// 📤 Export reducer
export default configSlice

// 📌 Selectors (best practice)
export const selectDnsConfigDetails = (state: RootState) => state.config.dnsConfigData