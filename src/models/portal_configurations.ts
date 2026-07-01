import mongoose from "mongoose";
import { Schema } from "mongoose";
import type { portalConfigurationSchemaTypes } from "../types/schemaTypes.js";

const portalConfigurationsSchema = new Schema<portalConfigurationSchemaTypes>({
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

    business_id: {
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

    favicon: {
        type: String,
        default: null,
    },

    slogan_line_1: {
        type: String,
        default: null,
    },

    slogan_line_2: {
        type: String,
        default: null,
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

    admin_email: {
        type: String,
        required: true,
        default: "bma_notification@yopmail.com"
    }
}, { minimize: false, timestamps: true });

const portalConfigurationsModel = mongoose.model<portalConfigurationSchemaTypes>("PortalConfigurations", portalConfigurationsSchema, "portal_configurations");

export { portalConfigurationsModel };