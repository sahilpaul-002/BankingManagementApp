export type portalConfigurationDataType = {
    domain_name: string;
    x_api_key: string;
    logo_url?: string | null;
    base_url_api: string;
    favicon?: string | null;
    slogan_line_1?: string | null;
    slogan_line_2?: string | null;
    userportal_link?: string | null;
    signup_required: boolean;
    dns_x_api_key: string;
    portal_type: string;
    m2p_allowed: boolean;
    p2p_allowed: boolean;
    admin_email: string;
    accessToken: string
}