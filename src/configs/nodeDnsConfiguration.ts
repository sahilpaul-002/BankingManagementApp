import dns from "node:dns";

// Set the DNS servers used by Node's c-ares resolver
dns.setServers([
    "1.1.1.1",
    "1.0.0.1"
]);

console.log("DNS servers:", dns.getServers());