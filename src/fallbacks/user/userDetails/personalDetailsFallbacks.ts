export interface PersonalDetailsType {
  userId: string;
  cardholderId: string;
  fullName: string;
  userEmail: string;
  gender: string;
  dob: string;
  isEmailVerified: string;
  isAdmin: string;
  isMasterAdmin: string;
  is2FaEnabled: string;
  twoFaType: string;
  mobileCountryCode: string;
  mobileCountryName: string;
}

export const PERSONAL_DETAILS_FALLBACK: PersonalDetailsType = {
  userId: "6a7a1b345b702971eafaa265",
  cardholderId: "6a84ada3b8f2bee755054d8e",
  fullName: "BMA Test 01",
  userEmail: "bmatest01@yopmail.com",
  gender: "MALE",
  dob: "1995-06-15T00:00:00.000Z",
  isEmailVerified: "Y",
  isAdmin: "Y",
  isMasterAdmin: "N",
  is2FaEnabled: "Y",
  twoFaType: "EMAIL-OTP",
  mobileCountryCode: "+91",
  mobileCountryName: "IN",
};
