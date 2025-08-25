const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  const definitions = req.app.get('definitions') || []

  // Get the definition parameter if provided
  const definitionParam = req.query.definition || 'TopoOpt.gh'
  const selectedDefinition = definitions.find(d => d.name === definitionParam) || definitions[0]

  const viewerHtml = '<!DOCTYPE html><html><head><title>Viewer</title></head><body><h1>Viewer</h1><p>Definition: ' + definitionParam + '</p></body></html>'

  res.send(viewerHtml)
})

module.exports = router
