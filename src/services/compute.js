'use strict';
const compute = require('compute-rhino3d');
const { PUBLIC_APP_ORIGIN, COMPUTE_URL, RHINO_COMPUTE_KEY } = require('../config');

function fileUrl(name){
  return new URL('/files/' + encodeURIComponent(name), PUBLIC_APP_ORIGIN).toString();
}

async function solve(definition, inputs = {}) {
  const def = /\.(gh|ghx)$/i.test(definition) ? definition : (definition + '.gh');

  // Configure compute client each call to be safe
  compute.url = COMPUTE_URL;
  compute.apiKey = RHINO_COMPUTE_KEY;

  const trees = [];
  for (const [k,v] of Object.entries(inputs)) {
    const t = new compute.Grasshopper.DataTree(k);
    t.append([0], Array.isArray(v) ? v : [v]);
    trees.push(t);
  }

  const res = await compute.Grasshopper.evaluateDefinition(fileUrl(def), trees, false);
  if (!res.ok) {
    const body = await res.text().catch(()=>'');
    const err = new Error(`Compute error ${res.status}: ${res.statusText}`);
    err.status = res.status; err.body = body;
    throw err;
  }
  return JSON.parse(await res.text());
}

module.exports = { solve };
