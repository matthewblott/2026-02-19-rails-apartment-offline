class Todo < ApplicationRecord
  self.primary_key = 'id'
  
  before_create :set_uuid, unless: :id?
  
  private
  
  def set_uuid
    self.id = SecureRandom.uuid
  end
end
