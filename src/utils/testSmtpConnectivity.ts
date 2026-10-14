import dns from 'node:dns/promises';
import net from 'node:net';

async function testSmtpConnectivity() {
    const host = 'smtp.gmail.com';
    const port = 465;

    try {
        const addresses = await dns.lookup(host, { all: true });
        console.info('[SMTP] DNS resolved:', addresses);

        await new Promise<void>((resolve, reject) => {
            const socket = net.createConnection({ host, port });

            socket.setTimeout(10_000);

            socket.once('connect', () => {
                console.info('[SMTP] TCP connection successful');
                socket.destroy();
                resolve();
            });

            socket.once('timeout', () => {
                socket.destroy();
                reject(new Error('SMTP TCP connection timed out'));
            });

            socket.once('error', reject);
        });
    } catch (error) {
        console.error('[SMTP] Connectivity test failed:', error);
    }
}