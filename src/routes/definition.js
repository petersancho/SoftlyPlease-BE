const express = require('express')
let router = express.Router()

/**
 * Get a grasshopper definition file
 * During a solve, the appserver sends definitions to compute as URLs that
 * point back at the appserver itself. These urls are only meant to be
 * consumed by compute.
 *
 * The urls are intentionally not easily discoverable. A md5 hash is computed
 * for every definition in the files directory and that hash is used for the
 * url that compute uses to get a definition.
 *
 * Compute caches definitions that are passed by url to improve performance.
 * Using a hash keeps the urls hard to find and also the same until a
 * definition is modified. 
 */
router.get('/:id', function(req, res, next) {
  let definitions = req.app.get('definitions') || []
  let definition = null

  // Try to find by hash first (for compute requests)
  definition = definitions.find(o => o.id === req.params.id)

  // If not found by hash, try to find by name (for direct requests)
  if (!definition) {
    definition = definitions.find(o => o.name === req.params.id)
  }

  // If still not found, return 404
  if (!definition) {
    return res.status(404).json({
      error: 'Definition not found',
      requestedId: req.params.id,
      availableDefinitions: definitions.map(d => ({ name: d.name, id: d.id }))
    })
  }

  const options = {
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true,
      'Content-Type': 'application/octet-stream'
    }
  }

  res.sendFile(definition.path, options, (error) => {
    if(error !== undefined) {
      console.error('Definition serving error:', error)
      next(error)
    }
  })
})

module.exports = router
