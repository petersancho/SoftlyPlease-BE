'use strict';
const path = require('path');

function pickEnv(names, def = '') {
  for (const n of names) {
    if (process.env[n]) return process.env[n];
    if (process.env[n.toLowerCase()]) return process.env[n.toLowerCase()];
  }
  return def;
}

function withTrailingSlash(u) {
  if (!u) return u;
  return /\/$/.test(u) ? u : u + '/';
}

const PUBLIC_APP_ORIGIN = withTrailingSlash(pickEnv(['PUBLIC_APP_ORIGIN'], 'https://www.softlyplease.com/'));
const COMPUTE_URL = withTrailingSlash(pickEnv(['COMPUTE_URL', 'RHINO_COMPUTE_URL']));
const RHINO_COMPUTE_KEY = pickEnv(['RHINO_COMPUTE_KEY']);

if (!COMPUTE_URL && process.env.NODE_ENV !== 'test') {
  console.warn('[config] No COMPUTE_URL or RHINO_COMPUTE_URL set. Solves will fail.');
}

if (!/^https?:\/\//i.test(PUBLIC_APP_ORIGIN) && process.env.NODE_ENV !== 'test') {
  console.warn('[config] PUBLIC_APP_ORIGIN is not an absolute URL:', PUBLIC_APP_ORIGIN);
}

module.exports = {
  ROOT: process.cwd(),
  PUBLIC_APP_ORIGIN,
  COMPUTE_URL,
  RHINO_COMPUTE_KEY,
  paths: {
    public: path.join(process.cwd(), 'public'),
    examples: path.join(process.cwd(), 'examples'),
    files: path.join(process.cwd(), 'files'),
  }
};
