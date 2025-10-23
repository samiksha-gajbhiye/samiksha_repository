const NodeCache = require('node-cache');
const { cacheTtlSeconds } = require('../config/env');

const cache = new NodeCache({
  stdTTL: cacheTtlSeconds,
  checkperiod: Math.max(10, Math.floor(cacheTtlSeconds / 2)),
  useClones: false,
});

function makeKey(prefix, payload) {
  return `${prefix}:${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
}

async function getOrSet(prefix, keyPayload, fetcher, ttlSeconds = cacheTtlSeconds) {
  const key = makeKey(prefix, keyPayload);
  const hit = cache.get(key);
  if (hit !== undefined) {
    return { value: hit, fromCache: true };
  }
  const value = await fetcher();
  cache.set(key, value, ttlSeconds);
  return { value, fromCache: false };
}

module.exports = { cache, getOrSet };
