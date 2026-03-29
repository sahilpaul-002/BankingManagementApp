import { LRUCache } from 'lru-cache'
import type { portalConfigurationSchema } from '../types/schemaTypes.js';

export type LRUCachedData = {
    ttl: number;
    ttlAutopurge: boolean;
    disposeAfter: (value: any, key: any, reason: any) => void;
    onInsert: (value: any, key: any) => void;
    allowStale: boolean;
    updateAgeOnGet: boolean;
    updateAgeOnHas: boolean;
    noUpdateTTL: boolean;
    updateTTLOnGet: boolean;
    updateTTLOnHas: boolean;
}

const options = {
    // TTL in milliseconds
    ttl: 1000 * 60 * 5, // 5 minutes

    // Automatically purge stale items
    ttlAutopurge: true,

    // Maximum number of items in cache
    // max: 100,

    // Log when items are disposed
    // disposeAfter: (value: any, key: any, reason: any) => {
    //     console.log(`Item with key ${key} was disposed due to ${reason}`);
    // },

    // Log when items are inserted
    // onInsert: (value: any, key: any) => {
    //     console.log(`Inserted item with key ${key}, value: ${value}`);
    // },

    // Remove items from cache after they are stale
    allowStale: false,

    // Update the age of items on get() or has()
    updateAgeOnGet: false,
    updateAgeOnHas: false,

    // Do not update TTL
    noUpdateTTL: true,

    // Update TTL on get() or has()
    updateTTLOnGet: false,
    updateTTLOnHas: false,
}

export const dnsConfigCache: LRUCache<string, portalConfigurationSchema> = new LRUCache(options)