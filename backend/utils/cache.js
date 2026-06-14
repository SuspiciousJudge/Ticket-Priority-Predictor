const CACHE = new Map();
const DEFAULT_TTL_MS = 1000 * 60 * 5; // 5 minutes

function set(key, value, ttl = DEFAULT_TTL_MS) {
  const expires = Date.now() + ttl;
  CACHE.set(key, { value, expires });
}

function get(key) {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { CACHE.delete(key); return null; }
  return entry.value;
}

function del(key) { CACHE.delete(key); }

function clear() { CACHE.clear(); }

module.exports = { set, get, del, clear };
