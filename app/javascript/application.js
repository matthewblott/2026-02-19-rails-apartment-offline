// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"
import { offlineManager } from "lib/offline_manager"

// Initialize offline support
// document.addEventListener('DOMContentLoaded', () => {
  offlineManager.init()
// }, { once: true })
