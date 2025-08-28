const express = require('express');
const router = express.Router();
const fetch = (...a)=>import('node-fetch').then(({default:fetch})=>fetch(...a));

router.get('/', async (req,res)=>{
  const base = process.env.COMPUTE_URL || '';
  let compute='down';
  try {
    const u = new URL('version', base).toString();
    const r = await fetch(u, { timeout: 3000 });
    if (r.ok) compute='up';
  } catch(e) {
    console.error('Status check error:', e.message);
  }
  res.json({ ok: true, compute, time: new Date().toISOString() });
});

module.exports = router;
