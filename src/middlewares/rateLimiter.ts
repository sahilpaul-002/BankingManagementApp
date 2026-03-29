import rateLimit from "express-rate-limit";

const rateLimiter = (): any => {
    // Allowed ip list
    const allowedIPs: string[] = [
        '192.168.0.56',
        '192.168.0.21',
        '192.168.29.0/24' // your subnet
    ]

    // Function to convert IP address to a 32 bit number
    const ipToNumber = (ip: string): number => {
        const parts = ip.split(".").map(p => parseInt(p || "0", 10));
        const [a = 0, b = 0, c = 0, d = 0] = parts;

        // Use arithmetic to avoid potential signed shift issues and ensure unsigned result
        return ((a * 2 ** 24) + (b * 2 ** 16) + (c * 2 ** 8) + d) >>> 0;
    };

    // Function to check if an IP is in the allowed list
    const isIpAllowed = (reqIP: string): boolean => {
        // Handle IPv4-mapped IPv6 addresses
        const cleanIP: string = reqIP.replace("::ffff:", ""); // Remove IPv6 prefix if present

        // Validate IPv4 format
        const ipParts: string[] = cleanIP.split(".");
        if (ipParts.length !== 4) return false;

        if (ipParts.some(part => isNaN(Number(part)))) {
            return false;
        }

        const requestIpNumber: number = ipToNumber(cleanIP);

        // Compare against allowed IPs and subnets
        return allowedIPs.some((allowedIP) => {
            /* ---- CASE 1: CIDR subnet ---- */
            if (allowedIP.includes("/")) {

                const [subnetIP, prefixStr]: string[] = allowedIP.split("/");
                if (!subnetIP || !prefixStr) return false;

                const prefix: number = Number(prefixStr);
                if (prefix < 0 || prefix > 32) return false;

                const subnetNumber: number = ipToNumber(subnetIP);

                // Create subnet mask
                const mask: number =
                    prefix === 0
                        ? 0
                        : (0xffffffff << (32 - prefix)) >>> 0;

                return (
                    (requestIpNumber & mask) ===
                    (subnetNumber & mask)
                );
            }

            /* ---- CASE 2: Exact IP ---- */
            return allowedIP === cleanIP;
        });
    };

    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
        standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
        legacyHeaders: true, // Disable the `X-RateLimit-*` headers.
        message: { status: "BAD_REQUEST", message: "Too many requests, please try again later." },
        skip: (req, res) => req.ip ? isIpAllowed(req.ip) : false,
    })
}

export default rateLimiter;