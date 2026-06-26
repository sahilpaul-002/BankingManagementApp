// FALLBACK COUNTRY DIAL CODES , COUNTRY NAME, COUNTRY ISO CODE ARRAY
const fallbackCoutries: mobileCountryCodesType  = [
  { country: "IN", code: "+91", name: "India" },
  { country: "US", code: "+1", name: "United States of America" },
  { country: "GB", code: "+44", name: "United Kingdom" },
  { country: "CA", code: "+1", name: "Canada" },
  { country: "AU", code: "+61", name: "Australia" },

  { country: "CN", code: "+86", name: "People's Republic of China" },
  { country: "JP", code: "+81", name: "Japan" },
  { country: "KR", code: "+82", name: "South Korea" },
  { country: "SG", code: "+65", name: "Singapore" },
  { country: "HK", code: "+852", name: "Hong Kong" },

  { country: "DE", code: "+49", name: "Germany" },
  { country: "FR", code: "+33", name: "France" },
  { country: "IT", code: "+39", name: "Italy" },
  { country: "ES", code: "+34", name: "Spain" },
  { country: "NL", code: "+31", name: "Netherlands" },
  { country: "BE", code: "+32", name: "Belgium" },
  { country: "CH", code: "+41", name: "Switzerland" },
  { country: "AT", code: "+43", name: "Austria" },
  { country: "SE", code: "+46", name: "Sweden" },

  { country: "BR", code: "+55", name: "Brazil" },
  { country: "MX", code: "+52", name: "Mexico" },
  { country: "AR", code: "+54", name: "Argentina" },

  { country: "RU", code: "+7", name: "Russian Federation" },

  { country: "TR", code: "+90", name: "Türkiye" },
  { country: "IL", code: "+972", name: "Israel" },

  { country: "AE", code: "+971", name: "United Arab Emirates" },
  { country: "SA", code: "+966", name: "Saudi Arabia" },
  { country: "QA", code: "+974", name: "Qatar" },
  { country: "KW", code: "+965", name: "Kuwait" },
  { country: "OM", code: "+968", name: "Oman" },

  { country: "TH", code: "+66", name: "Thailand" },
  { country: "MY", code: "+60", name: "Malaysia" },
  { country: "ID", code: "+62", name: "Indonesia" },
  { country: "PH", code: "+63", name: "Philippines" },
  { country: "VN", code: "+84", name: "Vietnam" },

  { country: "NZ", code: "+64", name: "New Zealand" },

  { country: "PT", code: "+351", name: "Portugal" },

  { country: "LU", code: "+352", name: "Luxembourg" },
  { country: "MC", code: "+377", name: "Monaco" },

  { country: "IR", code: "+98", name: "Islamic Republic of Iran" },
  { country: "IQ", code: "+964", name: "Iraq" },

  { country: "VE", code: "+58", name: "Venezuela" },
  { country: "UY", code: "+598", name: "Uruguay" },
  { country: "PY", code: "+595", name: "Paraguay" },

  { country: "TW", code: "+886", name: "Taiwan, Province of China" }
];


import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import countries from "i18n-iso-countries";

// register language (important)
import enLocale from "i18n-iso-countries/langs/en.json";
countries.registerLocale(enLocale);

type mobileCountryCodesType = Array<{
  country: CountryCode;
  code: string;
  name: string;
}>;

const mobileCountryCodesLists = (): mobileCountryCodesType => {
  const countryList: CountryCode[] = getCountries();

  const mobileCountryCodes = countryList.map((country) => ({
    country,
    code: "+" + getCountryCallingCode(country),
    name: countries.getName(country, "en") || country, // fallback
  }));

  // return mobileCountryCodes || fallbackCoutries;
  return fallbackCoutries;
};

export default mobileCountryCodesLists;