// import { Controller } from "@hotwired/stimulus"
//
// export default class extends Controller {
//   static targets = ["list"]
//   
//   async connect() {
//     await this.loadTodos()
//   }
//   
//   async loadTodos() {
//     const todos = await getTodosFromIndexedDB()
//     this.renderTodos(todos)
//   }
//   
//   async addTodo(event) {
//     event.preventDefault()
//     const formData = new FormData(event.target)
//     
//     const todo = {
//       id: Date.now(),
//       title: formData.get('title'),
//       createdAt: new Date()
//     }
//     
//     // Save to IndexedDB
//     await saveTodoToIndexedDB(todo)
//     
//     // Update the view
//     this.prependTodo(todo)
//     
//     // Queue for server sync if offline
//     if (!navigator.onLine) {
//       await queueOperation({ type: 'create', data: todo })
//     }
//   }
//   
//   prependTodo(todo) {
//     const html = this.todoTemplate(todo)
//     this.listTarget.insertAdjacentHTML('afterbegin', html)
//   }
//   
//   todoTemplate(todo) {
//     return `
//       <div id="todo-${todo.id}">
//         <h3>${todo.title}</h3>
//       </div>
//     `
//   }
// }
