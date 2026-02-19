Rails.application.routes.draw do

  scope "/:user_id", constraints: { user_id: /\d+/ }, as: 'user' do
    controller :todos do
      get    'todos',          action: :index,            as: 'todos'
      get    'todos/new',      action: :new,              as: 'new_todo'
      post   'todos',          action: :create,           as: 'todos_create'
      delete 'todos',          action: :destroy_multiple, as: 'todos_destroy_multiple'

      get    'todos/:id',      action: :show,             as: 'todo'
      get    'todos/:id/edit', action: :edit,             as: 'todo_edit'
      patch  'todos/:id',      action: :update,           as: 'todo_update'
      delete 'todos/:id',      action: :destroy,          as: 'todo_destroy'
    end
  end

  controller :static_pages do
    get 'about',   action: :about
  end

  controller :sessions do
    post 'sign_in', action: :create
    delete 'sign_out', action: :destroy
  end

  root "static_pages#home"
end
