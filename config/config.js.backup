/**
 * McNeel Rhino Compute AppServer Configuration
 * Following the official McNeel compute.rhino3d.appserver guide
 */

const config = {
  // Rhino Compute Server Configuration
  rhino: {
    url: process.env.RHINO_COMPUTE_URL || 'http://4.248.252.92:80/',
    apiKey: process.env.RHINO_COMPUTE_APIKEY || 'eyJSYXdPcGVuSWRUb2tlbiI6ICJleUpoYkdjaU9pSlNVekkxTmlJc0ltdHBaQ0k2SWpFaUxDSjBlWAFpT2lKS1YxUWlmUS5leUp6ZFdJaU9pSTFPVEV3TWpreE9EUTJOVEk1TURJMElpd2laVzFoYVd3aU9pSndaWFJsY21wellXNWphRzlBWjIxaGFXd3VZMjl0SWl3aVpXMWhhV3dmZG1WeWFXWnBaV1FpT25SeWRXVXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG1WdFlXbHNjeUk2V3lKd1pYUmxjbXB6WVc1amFHOUFaMjFoYVd3dVkyOXRJbDBzSW01aGJXVWlPaUpRWlhSbGNpQlhhVzVuYnlJc0lteHZZMkZzWlNJNkltVnVMV05oSWl3aWNHbGpkSFZ5WlNJNkltaDBkSEJ6T2k4dmQzZDNMbWR5WVhaaGRHRnlMbU52YlM5aGRtRjBZWEl2Tmpaall6bGtaVEkxT1RFNU9EZzNOakZpWm1JMll6VmtaV05qWkdFNE9HSV9aRDF5WlhSeWJ5SXNJbU52YlM1eWFHbHViek5rTG1GalkyOTFiblJ6TG0xbGJXSmxjbDluY205MWNITWlPbHQ3SW1sa0lqb2lOakExTlRFd09UUXlNREV5TWpFeE1pSXNJbTVoYldVaU9pSk5Ra1ZNWVdJaUxDSmtiMjFoYVc1eklqcGJYWDFkTENKamIyMHVjbWhwYm04elpDNWhZMk52ZFc1MGN5NWhaRzFwYmw5bmNtOTFjSE1pT2x0ZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV2ZDI1bGNsOW5jbTkxY0hNaU9sdDdJbWxrSWpvaU5EYzRPVFF4TlRrek56Z3pOVEF3T0NJc0ltNWhiV1VpT2lKRGIyMXdkWFJsSUhSbFlXMGlMQ0prYjIxaGFXNXpJanBiWFgxZExDSmpiMjB1Y21ocGJtOHpaQzVoWTJOdmRXNTBjeTV6YVdRaU9pSnJVWEYxSzNaV2JuUXlhbTl0U1hkMWFVWTFSM2hTVURaVE1ITTVkVVJxWkU4dlUxZEJORU0zTDNkelBTSXNJbWx6Y3lJNkltaDBkSEJ6T2k4dllXTmpiM1Z1ZEhNdWNtaHBibTh6WkM1amIyMGlMQ0poZFdRaU9pSmpiRzkxWkY5NmIyOWZZMnhwWlc1MElpd2laWGh3SWpvek16TXhNRFE0TURVMExDSnBZWFFpT2pFM05UUXlORGd3TlRVc0ltRjFkR2hmZEdsdFpTSTZNVGMxTkRJME1qRXpOU3dpYm05dVkyVWlPaUphZWs4elR6bE5OM0k1V1ZKVFFWUnFPRzE0UWxkcFlrNXNlblJyZEVoamRIWlFSRTVoY2pocFUxcEllWGxwUzBaSE5sSllWalY0UjA1NWFWWjBhRk5sSWl3aVlYUmZhR0Z6YUNJNkltSjFjVzlMT1Y5bFR6ZG5aVEpPWDJaZmVteEdkV2M5UFNKOS5DN0hxcVp6MDhQYkRMSEdBVHJvcmhvVEVud2lfQ0ZIYmdrYUoxSXFIVkQ2b3hGU2dMLUZWUjlGNHJkQmFiU3VMU2p2b0IwOW56Zgo3TlE0U29jSVlGNjJheDhkQjZSRTNaTW1NclhyZ1J5SUlTUlh6dmlqdE5oN3BWU1ZwMnVLdUFoZEFJZFJwekpMRHducTRZWHE1MlcwZmdjVHVicWlOSDE5X3RhbU9CVkVKa1hKZTBKWDU0X09KWWdFN1FIbXotQllSU0ZESWlLLWljRkJKbVAzeFFsMzBNeFduZ0pOWk5mazBWOWJTMDFqaU9lNUNRVGNndHM5M1V4UlRwRGNJQXg1UklsNDlqdHN5cW5YUEJvR1NvRG13Rjg3Y1lsMDY3dnh1VW44a1ZPdkFPVEREbTlzb2ctZ3Y3elFoSEd1aTRhb0dQblB5LUFZaEhMWW1sQkxTeFEiLCAiUmF3T0F1dGgyVG9rZW4iOiAiZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKaklqb3hMQ0p3SWpveExDSmlOalJwZGlJNkltSlNUV1IwVVVkMk4yZEdZVEpRWjJSVU5HVmpWM2M5UFNJc0ltSTJOR04wSWpvaVlYb3ZVRmRyWkc5NGJUWjJZMWh6YVRCYWEyYzRiVEV5WlZRMFZscHphbmRhYkN0bmNuTklPVXA1YmtkUE5VMTNWek41TlZNMVdIQnJiWE5NUWk5V1lsSXZkMWxwYTNKMldIQkdZMWR0ZFRkS1VXY3pLMlYyWkVkbFVWWmlXRFJpTkRkWVpFUlZWVkJwWXpnOUlpd2lhV0YwSWpveE56VTBNalE0TURVMWZRLjdBZmVzbGJRSXlxa0Y1VXhIampGUFpubjN4dWJqRHFDRF9Nb1VZWFZtaUUiLCAiU2NvcGUiOiBbImxpY2Vuc2VzIiwgInByb2ZpbGUiLCAiZ3JvdXBzIiwgImVtYWlsIiwgIm5vZXhwaXJlIiwgIm9wZW5pZCJdLCAiR3JvdXBJZCI6ICI0Nzg5NDE1OTM3ODM1MDA4In0=',
    timeout: 30000,
    retries: 3
  },

  // AppServer Configuration
  server: {
    port: process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 3000),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    concurrency: process.env.WEB_CONCURRENCY || 1
  },

  // Caching Configuration
  cache: {
    memcached: process.env.MEMCACHED_URL || null,
    ttl: 3600, // 1 hour
    enabled: true
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    debug: process.env.DEBUG || 'compute.appserver:*'
  },

  // Definition Configuration
  definitions: {
    directory: './src/files',
    extensions: ['.gh', '.ghx'],
    cacheDefinitions: true
  },

  // Bootstrap Configuration (for VM deployment)
  bootstrap: {
    computeUrl: process.env.COMPUTE_URL || 'http://4.248.252.92:80',
    appServerUrl: process.env.APPSERVER_URL || 'http://localhost:80',
    networkInterface: '0.0.0.0'
  }
};

module.exports = config;
