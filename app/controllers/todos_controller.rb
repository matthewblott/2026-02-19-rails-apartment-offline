class TodosController < ApplicationController
  before_action :set_todo, only: %i[ show edit update destroy ]

  def index
    @todos = Todo.all.order(created_at: :desc)
  end

  def show
  end

  def new
    @todo = Todo.new
  end

  def edit
  end

  def create
    # Handle client-generated UUID
    @todo = if todo_params[:id].present?
              Todo.find_or_initialize_by(id: todo_params[:id])
            else
              Todo.new
            end
    
    @todo.assign_attributes(todo_params.except(:id))

    respond_to do |format|
      if @todo.save
        format.turbo_stream {
          render turbo_stream: turbo_stream.prepend("todos", partial: "todos/todo", locals: { todo: @todo })
        }
        format.html { redirect_to user_todo_path(Current.user, @todo), notice: "Todo was successfully created." }
      else
        format.html { render :new, status: :unprocessable_entity }
      end
    end



  end

  def update
    respond_to do |format|
      if @todo.update(todo_params.except(:id))
        format.turbo_stream {
          render turbo_stream: turbo_stream.replace(@todo, partial: "todos/todo", locals: { todo: @todo })
        }
        format.html { redirect_to user_todo_path(Current.user, @todo), notice: "Todo was successfully updated." }
      else
        format.html { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @todo.destroy!

    respond_to do |format|
      format.turbo_stream {
        render turbo_stream: turbo_stream.remove(@todo)
      }
      format.html { redirect_to user_todos_path(Current.user), notice: "Todo was successfully destroyed." }
    end

  end

  private

  def set_todo
    @todo = Todo.find(params.expect(:id))
  end

  def todo_params
    params.require(:todo).permit(:id, :title, :details, :completed)
  end

end
