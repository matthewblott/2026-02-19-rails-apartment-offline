class OfflineDB {
  constructor() {
    this.dbName = 'todos_offline'
    this.version = 1
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Store for cached pages
        if (!db.objectStoreNames.contains('pages')) {
          db.createObjectStore('pages', { keyPath: 'url' })
        }

        // Store for queued operations
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async ensureDB() {
    if (!this.db) {
      await this.init()
    }
    return this.db
  }

  // Page caching methods
  async cachePage(url, html) {
    const db = await this.ensureDB()
    const transaction = db.transaction(['pages'], 'readwrite')
    const store = transaction.objectStore('pages')
    
    await store.put({
      url: url,
      html: html,
      cachedAt: new Date().toISOString()
    })
  }

  async getCachedPage(url) {
    const db = await this.ensureDB()
    const transaction = db.transaction(['pages'], 'readonly')
    const store = transaction.objectStore('pages')
    
    return new Promise((resolve, reject) => {
      const request = store.get(url)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Queue methods
  async queueOperation(operation) {
    const db = await this.ensureDB()
    const transaction = db.transaction(['queue'], 'readwrite')
    const store = transaction.objectStore('queue')
    
    const queuedOp = {
      ...operation,
      timestamp: new Date().toISOString()
    }
    
    return new Promise((resolve, reject) => {
      const request = store.add(queuedOp)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getQueuedOperations() {
    const db = await this.ensureDB()
    const transaction = db.transaction(['queue'], 'readonly')
    const store = transaction.objectStore('queue')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromQueue(id) {
    const db = await this.ensureDB()
    const transaction = db.transaction(['queue'], 'readwrite')
    const store = transaction.objectStore('queue')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearQueue() {
    const db = await this.ensureDB()
    const transaction = db.transaction(['queue'], 'readwrite')
    const store = transaction.objectStore('queue')
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineDB = new OfflineDB()
