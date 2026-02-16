import mongoose from "mongoose";
import { Schema } from "mongoose";
import type { portalConfigurationSchema } from "../types/schemaTypes.js";

const portalConfigurationsSchema = new Schema<portalConfigurationSchema>({
    domain_name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    agent_code: {
        type: String,
        required: true,
    },

    subagent_code: {
        type: String,
        required: true,
    },

    businessId: {
        type: String,
        required: true,
    },

    dashboard_name: {
        type: String,
        required: true
    },

    program_id: {
        type: String,
        required: true,
    },

    prefund_flag: {
        type: Boolean,
        required: true,
        default: true,
    },

    client_id: {
        type: String,
        required: true,
    },

    x_api_key: {
        type: String,
        required: true,
        index: true,
    },

    logo_url: {
        type: String,
        default: null,
    },

    base_url_api: {
        type: String,
        required: true,
    },

    nationality_list_url: {
        type: String,
        default: null,
    },

    mobilecountry_list_url: {
        type: String,
        default: null,
    },

    country_list_url: {
        type: String,
        default: null,
    },

    favicon: {
        type: String,
        default: null,
    },

    add_card_allowed: {
        type: Boolean,
        default: true,
    },

    crypto_allowed: {
        type: Boolean,
        default: false,
    },

    slogan_line_1: {
        type: String,
        default: null,
    },

    slogan_line_2: {
        type: String,
        default: null,
    },

    logo: {
        type: String,
        default: null,
    },

    currency_symbol: {
        type: String,
        required: true
    },

    currency_name: {
        type: String,
        required: true,
    },

    currency_img: {
        type: String,
        required: true,
    },

    userportal_link: {
        type: String,
        default: null,
    },

    signup_required: {
        type: Boolean,
        required: true,
        default: true,
    },

    dns_x_api_key: {
        type: String,
        required: true,
    },

    portal_type: {
        type: String,
        required: true,
        default: "Business"
    },

    m2p_allowed: {
        type: Boolean,
        required: true,
        default: true
    },

    p2p_allowed: {
        type: Boolean,
        required: true,
        default: true
    },
}, { minimize: false, timestamps: true });

const portalConfigurationsModel = mongoose.model<portalConfigurationSchema>("PortalConfigurations", portalConfigurationsSchema, "portal_configurations");

export { portalConfigurationsModel };