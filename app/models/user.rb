class User < ApplicationRecord
  before_validation :generate_device_token, on: :create
  validates :device_token, presence: true, uniqueness: true
  after_create :create_tenant

  private

  def generate_device_token
    self.device_token ||= SecureRandom.urlsafe_base64(32)
  end

  def create_tenant
    Apartment::Tenant.create(tenant_name)
  end

  def tenant_name
    "#{id}"
  end
end
