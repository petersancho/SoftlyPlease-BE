const memjs = require('memjs')

// Create a memcached client using environment variable for servers
const servers = process.env.MEMCACHED_SERVERS || '127.0.0.1:11211'
const client = memjs.Client.create(servers, {
  retries: 3,
  retry_delay: 1000,
  timeout: 5000,
  failures: 5,
  maxExpiration: 2592000 // 30 days max
})

/**
 * Get cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
function get(key) {
  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      if (err) {
        console.error('Memcached get error:', err)
        resolve(null) // Return null on error to allow fallback
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Set cached value with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 600)
 * @returns {Promise<boolean>} - Success status
 */
function set(key, value, ttl = 600) {
  return new Promise((resolve, reject) => {
    client.set(key, value, ttl, (err) => {
      if (err) {
        console.error('Memcached set error:', err)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

/**
 * Delete cached value
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
function del(key) {
  return new Promise((resolve, reject) => {
    client.del(key, (err) => {
      if (err) {
        console.error('Memcached delete error:', err)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

/**
 * Generate cache key from definition and inputs
 * @param {string} definition - Grasshopper definition name
 * @param {object} inputs - Input parameters
 * @returns {string} - Cache key
 */
function generateKey(definition, inputs) {
  const sortedInputs = JSON.stringify(inputs, Object.keys(inputs).sort())
  return `solve_${definition}_${Buffer.from(sortedInputs).toString('base64')}`
}

module.exports = {
  get,
  set,
  del,
  generateKey
}
