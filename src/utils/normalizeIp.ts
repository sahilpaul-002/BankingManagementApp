const normalizeIp = (ip: string | undefined | null): string | null => {
    if (!ip) return null;

    // Convert IPv4-mapped IPv6 to IPv4
    if (ip.startsWith("::ffff:")) {
        return ip.replace("::ffff:", "");
    }

    return ip;
};

export default normalizeIp;