// ==================================================================================
// Intercepting Turbo Navigation
// ==================================================================================
//
// You can intercept Turbo's fetch requests and serve cached HTML from IndexedDB instead.
// Listen before Turbo makes the request.
// document.addEventListener('turbo:before-fetch-request', async (event) => {
//   if (!navigator.onLine) {
//     event.preventDefault(); // Stop the normal fetch
//     
//     const url = event.detail.url.href;
//     const cachedHTML = await getCachedPage(url); // Your IndexedDB lookup
//     
//     if (cachedHTML) {
//       // Manually render the cached page
//       Turbo.renderStreamMessage(cachedHTML);
//       // or use Turbo.visit() with a custom fetch
//     }
//   }
// });

// ==================================================================================
// Better Approach: Custom Fetch Adapter
// ==================================================================================
//
// A cleaner solution is to hook into Turbo's fetch mechanism at a lower level.
// You can create a wrapper around fetch that checks IndexedDB first.
// Override the global fetch for Turbo requests.
const originalFetch = window.fetch;

window.fetch = async (url, options) => {
  if (!navigator.onLine) {
    const cached = await getFromIndexedDB(url);
    if (cached) {
      return new Response(cached.html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
  return originalFetch(url, options);
};

// ==================================================================================
// Caching Pages as You Visit
// ==================================================================================
//
// To build up your cache, store pages when they're successfully loaded.
document.addEventListener('turbo:load', async () => {
  const currentURL = window.location.href;
  const html = document.documentElement.outerHTML;
  await saveToIndexedDB(currentURL, html);
});

// ==================================================================================
// Queue-Based Sync Pattern
// ==================================================================================
//
// The standard approach is to queue operations in IndexedDB when offline,
// then replay them when online.
// Intercept form submissions when offline.
document.addEventListener('turbo:submit-start', async (event) => {
  if (!navigator.onLine) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Queue the operation
    await queueOperation({
      type: 'form_submission',
      url: form.action,
      method: form.method,
      data: Object.fromEntries(formData),
      timestamp: Date.now()
    });
    
    // Optimistically update the UI
    showSuccessMessage("Saved locally - will sync when online");
  }
});

// ==================================================================================
// Sync When Online
// ==================================================================================
//
// Listen for online event.
window.addEventListener('online', async () => {
  const queue = await getQueuedOperations();
  
  for (const operation of queue) {
    try {
      await fetch(operation.url, {
        method: operation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.data)
      });
      
      await removeFromQueue(operation.id);
    } catch (error) {
      // Keep in queue, will retry later
      console.error('Sync failed:', error);
    }
  }
});

// ==================================================================================
// Optimistic UI Updates
// ==================================================================================
//
// For better UX, update the UI immediately and assume success.
// async function createItem(data) {
//   const tempId = `temp-${Date.now()}`;
//   
//   // Update UI immediately with temporary ID
//   addItemToUI({ ...data, id: tempId });
//   
//   if (navigator.onLine) {
//     const response = await fetch('/items', {
//       method: 'POST',
//       body: JSON.stringify(data)
//     });
//     const savedItem = await response.json();
//     
//     // Replace temp ID with real server ID
//     replaceItemInUI(tempId, savedItem);
//   } else {
//     // Queue for later sync
//     await queueOperation({
//       type: 'create',
//       tempId: tempId,
//       url: '/items',
//       data: data
//     });
//   }
// }

// ==================================================================================
// Handling Server IDs
// ==================================================================================
//
// This is tricky - when you create records offline, you don't have server-generated IDs yet:
// Approach 1: Use temporary UUIDs/client-side IDs, then map them to server IDs after sync
// Approach 2: Pre-allocate ID ranges from server (e.g., offline device gets IDs 10000-10999)
// Approach 3: Use UUIDs everywhere (client generates, server accepts them)


// ==================================================================================
// Background Sync API
// ==================================================================================
//
// For more robust syncing, you can use the Background Sync API (via service worker).
// Register a sync when offline.
// if ('serviceWorker' in navigator && 'sync' in registration) {
//   await registration.sync.register('sync-operations');
// }
//
// // In your service worker
// self.addEventListener('sync', async (event) => {
//   if (event.tag === 'sync-operations') {
//     event.waitUntil(syncQueuedOperations());
//   }
// });


// ==================================================================================
// Turbo Streams (Recommended for Hotwire)
// ==================================================================================
//
// Use Turbo Streams to append/update/remove elements without full page reloads.
// When a todo is created (online or offline).
async function createTodo(data) {
  const todo = await saveTodo(data); // Saves to IndexedDB or server
  
  // Update the current view with Turbo Streams
  const stream = `
    <turbo-stream action="prepend" target="todos">
      <template>
        <div id="todo-${todo.id}">
          <h3>${todo.title}</h3>
          <p>${todo.description}</p>
        </div>
      </template>
    </turbo-stream>
  `;
  
  Turbo.renderStreamMessage(stream);
}
