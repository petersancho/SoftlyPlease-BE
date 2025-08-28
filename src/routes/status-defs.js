const express = require('express');
const router = express.Router();
const { listDefinitions } = require('../services/definition-resolver');

router.get('/', (req,res)=>{
  const list = listDefinitions();
  res.json({ ok: true, count: list.length, definitions: list });
});

module.exports = router;
