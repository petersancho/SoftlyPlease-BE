const express = require('express')
const router = express.Router()
const { solve: computeSolve } = require('../services/compute')

router.post('/', async (req, res) => {
  try{
    const defName = String(req.body?.definition || 'Hyperboloid.ghx')
    const inputs = Object.assign({}, req.body?.inputs || {})

    // Find registered definition (by name) and build a pointer URL
    const defObj = req.app.get('definitions').find(o => o.name === defName)
    if (!defObj) return res.status(400).json({ message: 'Definition not found on server.' })
    const fullUrl = req.protocol + '://' + req.get('host')
    const defUrl = `${fullUrl}/definition/${defObj.id}`

    // Compute
    const result = await computeSolve(defObj.name, inputs, defUrl)
    res.json(result)
  } catch (error){
    const msg = (error && error.message) ? String(error.message) : 'Internal Server Error'
    res.status(500).send(msg)
  }
})

module.exports = router

