import { logError } from "./errorLogger";
import mapToRtkError from "./mapToRtkError";

const rtkQueryCatchError = (
    err: unknown,
    service: string
) => {

    const error = err as any;

    const url =
        error?.config?.url ||
        error?.url ||
        "UNKNOWN_URL";

    logError("ERROR", {
        message: `${service} query failed`,
        error,
        context: url,
    });

    return mapToRtkError(error);
};

export default rtkQueryCatchError;