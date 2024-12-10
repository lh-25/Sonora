from django.urls import path
from . import views 

urlpatterns = [
  path('', views.Home.as_view(), name='home'),
  path('about/', views.about, name='about'),
  path('songs/', views.song_index, name='song-index'),
  path('songs/<int:song_id>/', views.song_detail, name='song-detail'),
  path('songs/create/', views.SongCreate.as_view(), name='song-create'),
  
  
  path('playlist/', views.playlist_index, name='playlist-index'),
  path('playlist/<int:playlist_id>/', views.playlist_detail, name='playlist-detail'),
  path('playlist/create/', views.PlaylistCreate.as_view(), name='playlist-create'),
  path('playlist/<int:pk>/update/',views.PlaylistUpdate.as_view(), name='playlist-update'),
  path('playlist/<int:pk>/delete/',views.PlaylistDelete.as_view(), name='playlist-delete'),
  
  
  path('song_of_the_day_posts/', views.song_of_the_day_post_index, name='song_of_the_day_post-index'),
  path('song_of_the_day_posts/<int:song_of_the_day_post_id>/', views.song_of_the_day_post_detail, name='song_of_the_day_post-detail'),
  path('song_of_the_day_posts/create/', views.song_of_the_day_postCreate.as_view(), name='song_of_the_day_post-create'),
  path('song_of_the_day_posts/<int:pk>/update/',views.song_of_the_day_postUpdate.as_view(), name='song_of_the_day_post-update'),
  path('song_of_the_day_posts/<int:pk>/delete/',views.song_of_the_day_postDelete.as_view(), name='song_of_the_day_post-delete'),
]
