from django.urls import path
from . import views 

urlpatterns = [
  path('', views.Home.as_view(), name='home'),
  path('about/', views.about, name='about'),
  path('accounts/signup/', views.signup, name='signup'),
   # Song URLs
  path('songs/', views.song_index, name='song-index'),
  path('songs/<int:song_id>/', views.SongDetails.as_view(), name='song_detail'),
  path('songs/new/', views.SongCreate.as_view(), name='song_create'),

  # Playlist URLs
  path('playlists/', views.playlist_index, name='playlist-index'),
  path('playlists/<int:playlist_id>/', views.playlist_details, name='playlist-detail'),
  path('my-playlists/', views.my_playlists, name='my_playlists'),
  path('playlists/new/', views.PlaylistCreate.as_view(), name='playlist_create'),
  path('playlists/<int:pk>/update/', views.PlaylistUpdate.as_view(), name='playlist_update'),
  path('playlists/<int:pk>/delete/', views.PlaylistDelete.as_view(), name='playlist_delete'),
  
  
  # Song of the Day URLs
  path('song-of-the-day/', views.songoftheday_index, name='song_of_the_day_index'),
  path('song-of-the-day/<int:post_id>/', views.songoftheday_details, name='song_of_the_day_detail'),
  path('song_of_the_days/my-posts/', views.my_posts, name='my_posts'),
  path('song-of-the-day/new/', views.SongOfTheDayCreate.as_view(), name='song_of_the_day_create'),
  path('song_of_the_day/<int:pk>/update/', views.SongOfTheDayUpdate.as_view(), name='song_of_the_day_update'),
  path('song_of_the_day/<int:pk>/delete/', views.SongOfTheDayDelete.as_view(), name='song_of_the_day_delete'),
  
]

    
    
