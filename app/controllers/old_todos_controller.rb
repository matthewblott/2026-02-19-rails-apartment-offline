class OldTodosController < ApplicationController
  before_action :set_todo, only: %i[ show edit update destroy ]

  def index
    @todos = Todo.all
  end

  def new
    @todo = Todo.new
  end

  def create
    @todo = Todo.find_or_initialize_by(id: todo_params[:id]) if todo_params[:id].present?
    @todo ||= Todo.new
    @todo.assign_attributes(todo_params.except(:id))

    if @todo.save
      redirect_to user_todo_path(Current.user, @todo), notice: "Todo was successfully created."
    else
      render :new, status: :unprocessable_content
    end
  end

  def update
    if @todo.update(todo_params)
      redirect_to user_todo_path(Current.user, @todo), notice: "Todo was successfully updated.", status: :see_other
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @todo.destroy!
    redirect_to user_todos_path(Current.user), notice: "Todo was successfully destroyed.", status: :see_other
  end

  private
    def set_todo
      @todo = Todo.find(params.expect(:id))
    end

    def todo_params
      params.require(:todo).permit(:id, :title, :details, :completed)
    end
end
