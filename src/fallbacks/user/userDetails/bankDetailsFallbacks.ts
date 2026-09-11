export interface BankDetailsType {
  account_holder_name: string;
  account_number: string;
  swift_code: string;
  iban_code: string;
  bank_name: string;
  is_verified: boolean;
}

export const BANK_DETAILS_FALLBACK: BankDetailsType = {
  account_holder_name: "Bma Test Zero One",
  account_number: "887654321012",
  swift_code: "KKBKINBB123",
  iban_code: "GB29NWBK60161331926819",
  bank_name: "KOTAK Bank",
  is_verified: true,
};
