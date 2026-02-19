class CreateTodos < ActiveRecord::Migration[8.1]
  def change
    create_table :todos, id: false do |t|
      t.string :id, limit: 36, primary_key: true, null: false
      t.string :title
      t.text :details
      t.boolean :completed, default: false
      t.timestamps
    end

    add_index :todos, :id, unique: true

  end
end
