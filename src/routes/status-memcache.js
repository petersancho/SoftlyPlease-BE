const express = require('express')
const memjs = require('memjs')

const router = express.Router()

function createClient(){
  const servers = process.env.MEMCACHIER_SERVERS
  const username = process.env.MEMCACHIER_USERNAME
  const password = process.env.MEMCACHIER_PASSWORD
  const tls = true
  const info = { servers, hasCreds: !!(username && password), tls }
  if (!servers || !username || !password){
    return { client: null, info }
  }
  const client = memjs.Client.create(servers, {
    username,
    password,
    tls,
    keepAlive: true,
    timeout: 1,
    failover: true
  })
  return { client, info }
}

router.get('/', async (req, res) => {
  const { client, info } = createClient()
  if (!client){
    return res.status(200).json({ connected: false, info, message: 'Missing MEMCACHIER_* env vars' })
  }
  try{
    const key = 'health:memcache'
    const val = String(Date.now())
    await new Promise((resolve, reject) => client.set(key, val, { expires: 10 }, err => err ? reject(err) : resolve()))
    const got = await new Promise((resolve, reject) => client.get(key, (err, data) => err ? reject(err) : resolve(data ? data.toString() : null)))
    try{ client.quit() }catch{}
    const ok = (got === val)
    return res.status(ok ? 200 : 500).json({ connected: ok, info, set: val, get: got })
  } catch (e){
    try{ client.quit() }catch{}
    return res.status(500).json({ connected: false, info, error: (e && e.message) ? e.message : String(e) })
  }
})

module.exports = router

