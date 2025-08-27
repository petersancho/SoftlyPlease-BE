/**
 * Route for Topological Optimization page
 */
const express = require('express')
const router = express.Router()

/**
 * Serve the topological optimization page
 */
router.get('/', function(req, res, next) {
  res.render('topological-optimization', {
    title: 'Topological Optimization - SoftlyPlease'
  })
})

module.exports = router
