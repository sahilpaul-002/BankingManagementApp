export interface dnsDataObjectType {
    domain_name: string
    dashboard_name: string
    prefund_flag: boolean
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

// export type dnsConfigResponseType = Omit<dnsDataObjectType, "x_api_key" | "accessToken">
export interface dnsConfigResponseType extends dnsDataObjectType { }

export type encryptionKeyResponseType = { key: string }

export interface apiResponseType<T> {
    status: string;
    message: string;
    data?: T;
    error?: any;
}