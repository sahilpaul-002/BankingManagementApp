export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  cardholderId: string;
  status: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postCode: string;
  country: string;
  isVerified: boolean;
  language: string;
  languageCode: string;
}

export const SETTINGS_DATA: UserSettings = {
  firstName: 'user',
  lastName: 'uqpay',
  email: 'useruqpaysandbox01@yopmail.com',
  mobileNumber: '+ 98765431',
  cardholderId: '8b2bfbf6...',
  status: 'SUCCESS',
  addressLine1: '5678 Oak Avenue',
  addressLine2: 'ufdebgvfedfvae',
  city: 'Los Angeles',
  state: 'fdavfeadvead',
  postCode: '94932',
  country: 'Singapore',
  isVerified: true,
  language: 'us English',
  languageCode: 'en-US',
};
