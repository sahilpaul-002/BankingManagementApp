import FingerprintJS, {type Agent, type GetResult } from "@fingerprintjs/fingerprintjs";

let deviceId: string | null = null;

const GetDeviceId = async (): Promise<string> => {
    if (!deviceId) {
        // Load FingerprintJS agent
        const fp: Agent = await FingerprintJS.load();

        // Get visitor ID result
        const result: GetResult = await fp.get();

        deviceId = result.visitorId;
    }

    return deviceId;
};

export default GetDeviceId;
