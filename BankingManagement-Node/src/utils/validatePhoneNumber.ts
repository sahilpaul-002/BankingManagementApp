import {
    parsePhoneNumberFromString,
    isPossiblePhoneNumber,
    isValidPhoneNumber,
    validatePhoneNumberLength,
    type CountryCode
} from 'libphonenumber-js'
import metadata from 'libphonenumber-js/metadata.min.json'

const ValidateMobileNumber = (phone: string, country: CountryCode = 'RU') => {
    if (!phone) {
        return { isValid: false, error: 'Phone number is required' }
    }

    // Trim spaces
    const cleanedPhone: string = phone.trim()
    console.log("cleanedPhone: ", cleanedPhone)

    // Length validation
    const lengthCheck = validatePhoneNumberLength(cleanedPhone, country)
    if (lengthCheck) {
        // Get the country data
        const countryData = metadata.countries[country]
        // Max phone numebr length
        const allowedLengths = countryData?.[3] || []
        // return { isValid: false, error: `Invalid length: ${lengthCheck}` }
        return {
            isValid: false,
            error: lengthCheck,
            allowedLengths, // ✅ exact allowed values
            message:
                allowedLengths.length === 1
                    ? `${lengthCheck?.replace(/_/g, " ")}: Phone number must be ${allowedLengths[0]} digits`
                    : `${lengthCheck?.replace(/_/g, " ")}: Phone number must be ${allowedLengths.join(', ')} digits`
        }
    }

    // Possible number check
    if (!isPossiblePhoneNumber(cleanedPhone, country)) {
        return { isValid: false, error: "Not Possible", message: 'Phone number is not possible' }
    }

    // Valid number check
    if (!isValidPhoneNumber(cleanedPhone, country)) {
        return { isValid: false, error: "Not Valid", message: 'Phone number is not valid' }
    }

    // Parse number safely
    const parsed = parsePhoneNumberFromString(cleanedPhone, country)

    return {
        isValid: true,
        formatted: parsed?.formatInternational(),
        e164: parsed?.format('E.164'),
        country: parsed?.country
    }
}

export default ValidateMobileNumber;