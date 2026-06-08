from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import api_views

urlpatterns = [
    # Auth
    path('auth/signup/', api_views.api_signup, name='api-signup'),
    path('auth/login/', TokenObtainPairView.as_view(), name='api-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    path('auth/me/', api_views.api_me, name='api-me'),

    # Songs
    path('songs/', api_views.api_songs, name='api-songs'),
    path('songs/<int:song_id>/', api_views.api_song_detail, name='api-song-detail'),

    # Playlists
    path('playlists/', api_views.api_playlists, name='api-playlists'),
    path('playlists/<int:playlist_id>/', api_views.api_playlist_detail, name='api-playlist-detail'),
    path('playlists/<int:playlist_id>/songs/', api_views.api_playlist_songs, name='api-playlist-songs'),
    path('playlists/<int:playlist_id>/songs/<int:song_id>/', api_views.api_playlist_songs, name='api-playlist-songs-remove'),

    # Posts (Song of the Day)
    path('posts/', api_views.api_posts, name='api-posts'),
    path('posts/<int:post_id>/', api_views.api_post_detail, name='api-post-detail'),
    path('posts/<int:post_id>/like/', api_views.api_like_post, name='api-like-post'),
    path('posts/<int:post_id>/comments/', api_views.api_add_comment, name='api-add-comment'),

    # Comments
    path('comments/<int:comment_id>/like/', api_views.api_like_comment, name='api-like-comment'),

    # Profiles
    path('profiles/', api_views.api_profiles, name='api-profiles'),
    path('profiles/<int:user_id>/', api_views.api_profile_detail, name='api-profile-detail'),
    path('profiles/<int:user_id>/follow/', api_views.api_follow_unfollow, name='api-follow-unfollow'),

    # Spotify
    path('spotify/search/', api_views.spotify_search, name='spotify-search'),
    path('spotify/auth-url/', api_views.spotify_auth_url, name='spotify-auth-url'),
    path('spotify/exchange/', api_views.spotify_exchange_token, name='spotify-exchange'),
    path('spotify/status/', api_views.spotify_status, name='spotify-status'),
    path('spotify/disconnect/', api_views.spotify_disconnect, name='spotify-disconnect'),
    path('spotify/playlists/', api_views.spotify_user_playlists, name='spotify-user-playlists'),
    path('spotify/import/', api_views.spotify_import_playlist, name='spotify-import-playlist'),
    path('spotify/tracks/<str:track_id>/', api_views.spotify_track_detail, name='spotify-track-detail'),
    path('spotify/web-callback/', api_views.spotify_web_callback, name='spotify-web-callback'),
    path('spotify/web-auth-url/', api_views.spotify_web_auth_url, name='spotify-web-auth-url'),
]
