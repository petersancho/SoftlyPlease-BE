class APIService {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async getHealth(): Promise<any> {
    return this.request('/health')
  }

  async getReady(): Promise<any> {
    return this.request('/ready')
  }

  async getMetrics(): Promise<any> {
    return this.request('/metrics')
  }

  async testConnection(): Promise<any> {
    try {
      const health = await this.getHealth()
      const ready = await this.getReady()
      const metrics = await this.getMetrics()

      return {
        isConnected: true,
        health,
        ready,
        metrics,
        errors: []
      }
    } catch (error: any) {
      return {
        isConnected: false,
        errors: [error.message]
      }
    }
  }
}

// Export utility functions
export const getCacheInfo = () => ({ memcachedAvailable: false })
export const getCacheStats = () => ({ hits: 0, misses: 0, hitRate: 0 })
export const getApiConfigInfo = () => ({
  baseURL: 'http://localhost:3000',
  hasApiKey: false,
  environment: 'development',
  cacheAvailable: false
})

const api = new APIService('http://localhost:3000')
export default api
