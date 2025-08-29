"use strict";
const NodeCache = require('node-cache');
let memjs;
try { memjs = require('memjs'); } catch (e) { memjs = null; }
const TTL = parseInt(process.env.CACHE_TTL || '600', 10);

const servers = process.env.MEMCACHIER_SERVERS || process.env.MEMCACHED_SERVERS || process.env.MEMCACHED_URL || null;
const user = process.env.MEMCACHIER_USERNAME || process.env.MEMCACHED_USERNAME || null;
const pass = process.env.MEMCACHIER_PASSWORD || process.env.MEMCACHED_PASSWORD || null;

let client = null;
if (memjs && servers) {
  const opts = { failover: true, keepAlive: true, timeout: 1500, retries: 2 };
  if (user && pass) { opts.username = user; opts.password = pass; }
  if (process.env.MEMCACHIER_SERVERS && process.env.MEMCACHIER_USE_TLS !== 'false') opts.tls = {};
  try { client = memjs.Client.create(servers, opts); console.log('[cache] memcached on', servers); }
  catch (e) { console.warn('[cache] memcached disabled:', e.message); client = null; }
}

const local = new NodeCache({ stdTTL: TTL, useClones: false });

function get(key) {
  return new Promise((resolve) => {
    if (client) {
      client.get(key, (err, data) => {
        if (err) { console.error('[cache] memcached get error:', err); return resolve(null); }
        if (!data) return resolve(null);
        return resolve(data.toString());
      });
    } else {
      const v = local.get(key);
      return resolve(v === undefined ? null : v);
    }
  });
}

function set(key, val, ttl = TTL) {
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  return new Promise((resolve) => {
    if (client) {
      client.set(key, str, { expires: ttl }, () => resolve(true));
    } else {
      local.set(key, str, ttl);
      resolve(true);
    }
  });
}

function generateKey(def, inputs) {
  const sorted = {};
  Object.keys(inputs || {}).sort().forEach(k => sorted[k] = inputs[k]);
  return 'solve_' + Buffer.from(JSON.stringify({ def, inputs: sorted })).toString('base64url');
}

module.exports = { get, set, generateKey };
