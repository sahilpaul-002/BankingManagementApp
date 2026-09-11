export interface AddressType {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface AddressDetailsType {
  userId: string;
  billing_address: AddressType;
  delivery_address: AddressType;
}

export const ADDRESS_DETAILS_FALLBACK: AddressDetailsType = {
  userId: "6a7a1b345b702971eafaa265",
  billing_address: {
    line1: "1B Rose Street",
    line2: "Near East Park",
    city: "London",
    state: "Greater London",
    postal_code: "GS5R5Xd",
    country: "United Kingdom",
  },
  delivery_address: {
    line1: "1B Rose Street",
    line2: "Near East Park",
    city: "London",
    state: "Greater London",
    postal_code: "GS5R5Xd",
    country: "United Kingdom",
  },
};
