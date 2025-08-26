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
  let definition = req.app.get('definitions').find(o => o.id === req.params.id)

  if (!definition) {
    return res.status(404).send('Definition not found')
  }

  // Set headers to allow cross-origin access for Rhino Compute
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, RhinoComputeKey')

  const options = {
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  res.sendFile(definition.path, options, (error) => {
    if(error !== undefined) {
      console.log('Error serving definition:', error)
      res.status(500).send('Error serving definition')
    }
  })
})

module.exports = router
