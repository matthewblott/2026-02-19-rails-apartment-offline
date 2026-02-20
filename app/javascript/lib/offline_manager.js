import { offlineDB } from 'lib/indexed_db'
// import * as Turbo from '@hotwired/turbo'

class OfflineManager {
  constructor() {
    this.syncing = false
    this.init()
  }

  async init() {
    await offlineDB.init()
    this.setupEventListeners()
    this.setupFetchInterceptor()
  }

  setupEventListeners() {
    // Cache pages after they load
    document.addEventListener('turbo:load', async () => {
      const url = window.location.href
      const html = document.documentElement.outerHTML
      await offlineDB.cachePage(url, html)
      console.log('Cached page:', url)
    })

    // Intercept form submissions when offline
    document.addEventListener('turbo:submit-start', async (event) => {
      if (!navigator.onLine) {
        event.preventDefault()
        await this.handleOfflineSubmit(event)
      }
    })

    // Sync when coming back online
    window.addEventListener('online', async () => {
      console.log('Back online - syncing queued operations')
      await this.syncQueue()
    })

    // Monitor online/offline status
    window.addEventListener('offline', () => {
      console.log('Gone offline')
      this.showOfflineNotice()
    })
  }

  setupFetchInterceptor() {
    const originalFetch = window.fetch

    window.fetch = async (url, options = {}) => {
      // Only intercept GET requests when offline
      if (!navigator.onLine && (!options.method || options.method === 'GET')) {
        console.log('Offline - checking cache for:', url)
        
        const urlString = url.toString()
        const cached = await offlineDB.getCachedPage(urlString)
        
        if (cached) {
          console.log('Serving from cache:', urlString)
          return new Response(cached.html, {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'text/html; charset=utf-8'
            }
          })
        }
      }

      // Otherwise, use normal fetch
      return originalFetch(url, options)
    }
  }

  async handleOfflineSubmit(event) {
    const form = event.detail.formSubmission.formElement
    const formData = new FormData(form)
    const method = form.method.toUpperCase()
    const action = form.action

    // Extract form data
    const data = {}
    for (let [key, value] of formData.entries()) {
      data[key] = value
    }

    // Queue the operation
    await offlineDB.queueOperation({
      type: 'form_submission',
      method: method,
      url: action,
      data: data,
      formHTML: form.outerHTML
    })

    console.log('Queued offline operation:', { method, url: action, data })

    // Handle optimistic UI update
    await this.handleOptimisticUpdate(method, action, data)

    // Show feedback
    this.showOfflineSubmitNotice()
  }

  async handleOptimisticUpdate(method, url, data) {
    // For create operations, add to the UI optimistically
    if (method === 'POST' && url.includes('/todos')) {
      const todoData = data['todo'] ? this.parseNestedParams(data, 'todo') : data
      
      const id = crypto.randomUUID()
      const stream = `
        <turbo-stream action="prepend" target="todos">
          <template>
            <div id="todo_${id}" class="todo-item offline-pending">
              <h3>${this.escapeHtml(todoData.title || '')}</h3>
              <p>${this.escapeHtml(todoData.details || '')}</p>
              <span class="offline-badge">Pending sync...</span>
            </div>
          </template>
        </turbo-stream>
      `
      
      Turbo.renderStreamMessage(stream)
    }
    
    // For update operations
    if (method === 'PATCH' || method === 'PUT') {
      const todoData = data['todo'] ? this.parseNestedParams(data, 'todo') : data
      const todoId = this.extractIdFromUrl(url)
      
      if (todoId) {
        const stream = `
          <turbo-stream action="update" target="todo_${todoId}">
            <template>
              <div id="todo_${todoId}" class="todo-item offline-pending">
                <h3>${this.escapeHtml(todoData.title || '')}</h3>
                <p>${this.escapeHtml(todoData.details || '')}</p>
                <span class="offline-badge">Pending sync...</span>
              </div>
            </template>
          </turbo-stream>
        `
        
        Turbo.renderStreamMessage(stream)
      }
    }
    
    // For delete operations
    if (method === 'DELETE') {
      const todoId = this.extractIdFromUrl(url)
      
      if (todoId) {
        const stream = `
          <turbo-stream action="remove" target="todo_${todoId}">
          </turbo-stream>
        `
        
        Turbo.renderStreamMessage(stream)
      }
    }
  }

  async syncQueue() {
    if (this.syncing) {
      console.log('Already syncing...')
      return
    }

    this.syncing = true
    this.showSyncNotice()

    try {
      const queue = await offlineDB.getQueuedOperations()
      console.log(`Syncing ${queue.length} operations...`)

      for (const operation of queue) {
        try {
          await this.syncOperation(operation)
          await offlineDB.removeFromQueue(operation.id)
          console.log('Synced operation:', operation.id)
        } catch (error) {
          console.error('Failed to sync operation:', operation.id, error)
          // Keep in queue for retry
        }
      }

      console.log('Sync complete')
      this.hideSyncNotice()
      
      // Reload current page to get fresh data
      if (queue.length > 0) {
        Turbo.visit(window.location.href, { action: 'replace' })
      }
    } finally {
      this.syncing = false
    }
  }

  async syncOperation(operation) {
    const { method, url, data } = operation

    // Convert flat data to FormData
    const formData = new FormData()
    for (let [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        formData.append(key, value)
      }
    }

    const response = await fetch(url, {
      method: method,
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/vnd.turbo-stream.html'
      }
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    return response
  }

  // Helper methods
  parseNestedParams(data, prefix) {
    const result = {}
    const prefixWithBracket = `${prefix}[`
    
    for (let [key, value] of Object.entries(data)) {
      if (key.startsWith(prefixWithBracket)) {
        const cleanKey = key.slice(prefixWithBracket.length, -1)
        result[cleanKey] = value
      }
    }
    
    return result
  }

  extractIdFromUrl(url) {
    const match = url.match(/\/todos\/([^\/]+)/)
    return match ? match[1] : null
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // UI feedback methods
  showOfflineNotice() {
    this.showNotice('You are offline. Changes will be synced when connection is restored.', 'warning')
  }

  showOfflineSubmitNotice() {
    this.showNotice('Saved locally. Will sync when online.', 'info', 3000)
  }

  showSyncNotice() {
    this.showNotice('Syncing changes...', 'info')
  }

  hideSyncNotice() {
    this.hideNotice()
    this.showNotice('All changes synced!', 'success', 3000)
  }

  showNotice(message, type = 'info', duration = null) {
    // Remove existing notice
    this.hideNotice()

    const notice = document.createElement('div')
    notice.id = 'offline-notice'
    notice.className = `offline-notice offline-notice-${type}`
    notice.textContent = message
    document.body.appendChild(notice)

    if (duration) {
      setTimeout(() => this.hideNotice(), duration)
    }
  }

  hideNotice() {
    const existing = document.getElementById('offline-notice')
    if (existing) {
      existing.remove()
    }
  }
}

export const offlineManager = new OfflineManager()
