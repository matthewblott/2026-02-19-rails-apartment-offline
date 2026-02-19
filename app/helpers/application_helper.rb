module ApplicationHelper
  def page_title
    content_for(:title || 'Skribl')
  end

  def is_signed_in?
    !Current.user.nil? 
  end

end
