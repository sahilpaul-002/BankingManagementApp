import { AxiosError } from "axios";
import mapToRtkError from "./mapToRtkError";
import { AppErrorClass} from "./appError";
import { logError } from "./errorLogger";

type ExternalApplicationErrorType = {
    error: {
        status: number;
        data: {
            status: string;
            message: string;
            error?: any;
        };
    };
};

const rtkQueryCatchError = (err: unknown, service: string): ExternalApplicationErrorType=> {
    const error = err as any;
    const url =
        error?.config?.url ||
        error?.url ||
        "UNKNOWN_URL";
    const errorClassName = error?.constructor?.name || "UnknownErrorClass";

    if (error instanceof AxiosError) {
        return mapToRtkError(error, `${service} faced external application service error`);
    }
    else if (error instanceof AppErrorClass) {
        logError("ERROR", {
            message: `{${service}} query faced application service error: ${error.message}`,
            error: err,
            context: url,
        });
        return mapToRtkError(error, `${service} - query faced unknown internal application error: ${error?.message || "No error message"}`);
            // throw new ApplicationServiceError(
            //     `[${errorClassName}] ${error.message}`,
            //     service,
            //     error
            // );
            }
    else {
        logError("ERROR", {
            message: `{ ${ service }} query faced internal service error: ${ error.message } `,
            error: err,
            context: url,
        });
        return mapToRtkError(error, `${ service } - ${ errorClassName }] ${ error.message }:  query faced unknown internal application error `);
        // throw new InternalApplicationError(
        //     `${ service } query faced unknown internal application error: ${ error?.message || "No error message" } `,
        //     service,
        //     error
        // );
    }
}

export default rtkQueryCatchError;