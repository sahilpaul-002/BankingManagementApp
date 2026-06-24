export type KYCStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW';
export type ComplianceStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type VerificationType = 'E_KYC' | 'MANUAL_KYC' | 'VIDEO_KYC';

export interface VerificationData {
  kycStatus: KYCStatus;
  complianceStatus: ComplianceStatus;
  verificationType: VerificationType;
  lastUpdated?: string;
  message: string;
}

export const VERIFICATION_DATA: VerificationData = {
  kycStatus: 'PENDING',
  complianceStatus: 'IN_PROGRESS',
  verificationType: 'E_KYC',
  message: 'Please complete the identity verification process to proceed.',
  lastUpdated: '2024-06-15T10:30:00Z',
};

export const getKYCStatusLabel = (status: KYCStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'PENDING';
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    case 'IN_REVIEW':
      return 'IN_REVIEW';
    default:
      return 'UNKNOWN';
  }
};

export const getComplianceStatusLabel = (status: ComplianceStatus): string => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'UNKNOWN';
  }
};

export const getVerificationTypeLabel = (type: VerificationType): string => {
  switch (type) {
    case 'E_KYC':
      return 'E_KYC';
    case 'MANUAL_KYC':
      return 'MANUAL_KYC';
    case 'VIDEO_KYC':
      return 'VIDEO_KYC';
    default:
      return 'UNKNOWN';
  }
};
