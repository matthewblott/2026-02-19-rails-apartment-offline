class StaticPagesController < ApplicationController
  skip_before_action :authenticate_user!, only: [ :home, :about ]
  skip_before_action :authorize_user!
end
