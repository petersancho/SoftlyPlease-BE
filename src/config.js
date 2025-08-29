'use strict';
const path = require('path');

function pickEnv(names, def = '') {
  for (const n of names) {
    if (process.env[n]) return process.env[n];
    if (process.env[n.toLowerCase()]) return process.env[n.toLowerCase()];
  }
  return def;
}

function withSlash(u){ if (!u) return u; return /\/$/.test(u) ? u : u + '/'; }

const PUBLIC_APP_ORIGIN = withSlash(pickEnv(['PUBLIC_APP_ORIGIN'], 'http://localhost:3000/'));
const COMPUTE_URL = withSlash(pickEnv(['COMPUTE_URL','RHINO_COMPUTE_URL']));
const RHINO_COMPUTE_KEY = pickEnv(['RHINO_COMPUTE_KEY']);

const paths = {
  public: path.join(process.cwd(), 'public'),
  examples: path.join(process.cwd(), 'examples'),
  files: path.join(process.cwd(), 'files')
};

module.exports = { PUBLIC_APP_ORIGIN, COMPUTE_URL, RHINO_COMPUTE_KEY, paths };
