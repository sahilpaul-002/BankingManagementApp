import { getCountries, getCountryCallingCode, type CountryCallingCode, type CountryCode } from "libphonenumber-js";
import type { successResponseJson } from "../types/responseJson.js";

type mobileCountryCodesType = Array<{ country: CountryCode, code: string }>;

const listCountryMobileCodes = (): successResponseJson => {
    try {
        const countries: CountryCode[] = getCountries();

        const mobileCountryCodes: mobileCountryCodesType = countries.map(country => ({
            country, // ISO 2-letter (needed internally)
            code: "+" + getCountryCallingCode(country)
        }));

        return {status: "SUCCESS",message: "Mobile country codes generated successfully", data: mobileCountryCodes};
    }
    catch (error) {
        throw new Error("Error fetching country mobile codes: " + (error instanceof Error ? error.message : String(error)));
    }
}

export default listCountryMobileCodes;