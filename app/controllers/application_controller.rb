class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  before_action :load_current_user
  before_action :authenticate_user!
  before_action :authorize_user!

  private

  def load_current_user
    token = cookies.encrypted[:device_token]
    return unless token

    if (user = User.find_by(device_token: token))
      Current.user = user
    end
  end

  def authenticate_user!
    return if Current.user
    redirect_to root_path
  end

  def authorize_user!
    return unless params[:user_id].present?
    
    unless Current.user.id == params[:user_id].to_i
      redirect_to root_path, alert: "Not authorised."
    end
  end

end
