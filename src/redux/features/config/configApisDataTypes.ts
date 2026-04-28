export interface dnsDataObjectType {
    domain_name: string
    agent_code: string
    subagent_code: string
    business_id: string
    dashboard_name: string
    program_id: string
    prefund_flag: boolean
    client_id: string
    x_api_key: string
    logo_url?: string | null
    base_url_api: string
    favicon?: string | null
    add_card_allowed: boolean
    crypto_allowed: boolean
    slogan_line_1?: string | null
    slogan_line_2?: string | null
    logo?: string | null
    currency_symbol: string
    currency_name: string
    currency_img: string
    signup_required: boolean
    dns_x_api_key: string
    portal_type: string
    m2p_allowed: boolean
    p2p_allowed: boolean
    accessToken: string
}

export type processedDnsDataObjectType = {
    domain_name: string
    dashboard_name: string
    prefund_flag: boolean
    logo_url?: string | null
    base_url_api: string
    favicon?: string | null
    add_card_allowed: boolean
    crypto_allowed: boolean
    slogan_line_1?: string | null
    slogan_line_2?: string | null
    logo?: string | null
    currency_symbol: string
    currency_name: string
    currency_img: string
    signup_required: boolean
    portal_type: string
    m2p_allowed: boolean
    p2p_allowed: boolean
}

export interface dnsConfigRequestType {
    domainName: string
}

export interface dnsConfigResponseType extends dnsDataObjectType { }

export type encryptionKeyResponseType = { key: string }

export interface apiResponseType<T> {
    status: string;
    message: string;
    data?: T;
    error?: any;
}

export type applicationHeadersType = {
    'x-api-key'?: string;
    'agent-code'?: string;
    'subagent-code'?: string;
    'program-id'?: string;
    'business-id'?: string;
    'client-id'?: string;
    'authorization'?: string;
};