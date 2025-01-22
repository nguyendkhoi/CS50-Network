
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create-post", views.create_post, name="create-post"),
    path("post", views.posting, name="post"),
    path("post/<int:post_id>/like", views.addLike, name="addLike"),
    path("post/<int:post_id>/comment", views.addComment, name="addComment"),
    path("user/<int:user_id>", views.profile, name="profile"),
    path("user/<int:user_id>/follow", views.follow, name="follow"),
    path("following", views.following, name="following"),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
