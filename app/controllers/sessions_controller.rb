class SessionsController < ApplicationController
  before_action :require_user, only: :destroy

  skip_before_action :authenticate_user!, only: :create

  def create
    return redirect_to root_path if Current.user

    user = User.create!

    cookies.permanent.encrypted[:device_token] = {
      value: user.device_token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax
    }

    Current.user = user

    redirect_to user_todos_path(Current.user)
  end

  def destroy
    Apartment::Tenant.drop(Current.user.id.to_s)
    # Deleting the user is for device based auth only
    Current.user&.destroy
    cookies.delete(:device_token)
    redirect_to root_path
  end

  private

  def require_user
    redirect_to root_path unless Current.user
  end

end
