/**
 * Route for Topological Optimization page
 */
const express = require('express')
const router = express.Router()
const path = require('path')

/**
 * Serve the topological optimization page
 */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../examples/topological-optimization/index.html'))
})

module.exports = router
