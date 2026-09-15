export function isKybApproved(kybDetails: any): boolean {
    if (!kybDetails) return false;

    return kybDetails?.bankDetails?.is_verified === true;
}