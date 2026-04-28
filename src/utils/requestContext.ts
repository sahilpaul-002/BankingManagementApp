import { AsyncLocalStorage } from 'async_hooks';
import type { Request } from 'express';

interface RequestContext {
    requestSession?: Request["session"]
    requestHeaders?: Request["headers"]
}

const tenantStorage = new AsyncLocalStorage<RequestContext>();

// Run a function within a request context.
export function runWithRequest<T>(context: RequestContext, fn: () => T): T {
    return tenantStorage.run(context, fn);
}

// Get the current request session from context.
export function getRequestSession(): Request["session"] | undefined {
    return tenantStorage.getStore()?.requestSession;
}

// Get the current request headers from context.
export function getRequestHeaders(): Request["headers"] | undefined {
    return tenantStorage.getStore()?.requestHeaders;
}