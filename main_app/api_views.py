import logging
import os
import uuid
import boto3
import requests
import urllib.parse
from datetime import timedelta

logger = logging.getLogger(__name__)

from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import UserRateThrottle


class PostCreateThrottle(UserRateThrottle):
    scope = 'post_create'

    def allow_request(self, request, view):
        if request.method != 'POST':
            return True
        return super().allow_request(request, view)


class CommentCreateThrottle(UserRateThrottle):
    scope = 'comment_create'


class LikeThrottle(UserRateThrottle):
    scope = 'like'

from rest_framework_simplejwt.tokens import RefreshToken

from .models import Song, Playlist, SongOfTheDay, Comment, Profile, SpotifyToken
from .serializers import (
    SignupSerializer, UserSerializer, ProfileSerializer,
    SongSerializer, PlaylistSerializer, PlaylistCreateSerializer,
    SongOfTheDaySerializer, CommentSerializer,
)


def _s3_upload(file_obj, folder='uploads'):
    """Upload a file object to S3 and return its URL, or None on error."""
    try:
        s3 = boto3.client('s3')
        ext = os.path.splitext(file_obj.name)[1] if '.' in file_obj.name else ''
        key = f"{folder}/{uuid.uuid4().hex}{ext}"
        bucket = os.environ['S3_BUCKET']
        s3.upload_fileobj(file_obj, bucket, key)
        return f"{os.environ['S3_BASE_URL']}{bucket}/{key}"
    except Exception as e:
        logger.error('S3 upload error: %s', e)
        return None


# ─── Auth ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def api_signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_me(request):
    profile = getattr(request.user, 'profile', None)
    if request.method == 'GET':
        return Response({
            'user': UserSerializer(request.user).data,
            'profile': ProfileSerializer(profile).data if profile else None,
        })

    # PATCH — update profile
    user = request.user
    if 'username' in request.data:
        new_username = request.data['username'].strip()
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
                return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = new_username
            user.save()

    if profile is None:
        profile = Profile.objects.create(user=user)

    if 'bio' in request.data:
        profile.bio = request.data['bio']

    pic_file = request.FILES.get('profile_picture')
    if pic_file:
        url = _s3_upload(pic_file, 'profile_picture')
        if url:
            profile.profile_picture = url

    profile.save()
    return Response({
        'user': UserSerializer(user).data,
        'profile': ProfileSerializer(profile).data,
    })


# ─── Songs ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_songs(request):
    if request.method == 'GET':
        songs = Song.objects.all()
        genre = request.query_params.get('genre')
        search = request.query_params.get('search')
        if genre:
            songs = songs.filter(genre__iexact=genre)
        if search:
            songs = songs.filter(
                Q(title__icontains=search) |
                Q(artist__icontains=search) |
                Q(album__icontains=search)
            )
        paginator = PageNumberPagination()
        paginator.page_size = 12
        page = paginator.paginate_queryset(songs, request)
        serializer = SongSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    # POST — create a song (without file upload; pass album_cover as URL)
    serializer = SongSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_song_detail(request, song_id):
    try:
        song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(SongSerializer(song).data)

    # PATCH — update Spotify link fields
    allowed = {'spotify_track_id', 'preview_url'}
    data = {k: v for k, v in request.data.items() if k in allowed}
    serializer = SongSerializer(song, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Playlists ────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_playlists(request):
    if request.method == 'GET':
        show = request.query_params.get('filter', 'public')
        user_id = request.query_params.get('user_id')
        if user_id:
            playlists = Playlist.objects.filter(user_id=user_id, visibility='PUBLIC')
        elif show == 'mine':
            playlists = Playlist.objects.filter(user=request.user)
        else:
            playlists = Playlist.objects.filter(visibility='PUBLIC')
        paginator = PageNumberPagination()
        paginator.page_size = 12
        page = paginator.paginate_queryset(playlists, request)
        serializer = PlaylistSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    serializer = PlaylistCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_playlist_detail(request, playlist_id):
    try:
        playlist = Playlist.objects.get(id=playlist_id)
    except Playlist.DoesNotExist:
        return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(PlaylistSerializer(playlist).data)

    if playlist.user != request.user:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        playlist.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = PlaylistCreateSerializer(playlist, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(PlaylistSerializer(playlist).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_playlist_songs(request, playlist_id, song_id=None):
    try:
        playlist = Playlist.objects.get(id=playlist_id, user=request.user)
    except Playlist.DoesNotExist:
        return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        sid = request.data.get('song_id') or song_id
        try:
            song = Song.objects.get(id=sid)
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
        playlist.songs.add(song)
        return Response({'status': 'added'})

    # DELETE
    try:
        song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
    playlist.songs.remove(song)
    return Response({'status': 'removed'})


# ─── Song of the Day (Posts) ──────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([PostCreateThrottle])
def api_posts(request):
    if request.method == 'GET':
        show = request.query_params.get('filter', 'all')
        user_id = request.query_params.get('user_id')
        if user_id:
            posts = SongOfTheDay.objects.filter(user_id=user_id)
        elif show == 'mine':
            posts = SongOfTheDay.objects.filter(user=request.user)
        else:
            posts = SongOfTheDay.objects.all().order_by('-date_posted')
        paginator = PageNumberPagination()
        paginator.page_size = 12
        page = paginator.paginate_queryset(posts, request)
        serializer = SongOfTheDaySerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    serializer = SongOfTheDaySerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        post = serializer.save(user=request.user)
        pic_file = request.FILES.get('post_image')
        if pic_file:
            url = _s3_upload(pic_file, 'post_images')
            if url:
                post.post_image = url
                post.save()
        return Response(SongOfTheDaySerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_post_detail(request, post_id):
    try:
        post = SongOfTheDay.objects.get(id=post_id)
    except SongOfTheDay.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SongOfTheDaySerializer(post, context={'request': request})
        comments = post.comments.filter(parent=None)
        comment_serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response({**serializer.data, 'comments': comment_serializer.data})

    if post.user != request.user:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = SongOfTheDaySerializer(post, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([LikeThrottle])
def api_like_post(request, post_id):
    try:
        post = SongOfTheDay.objects.get(id=post_id)
    except SongOfTheDay.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True
    return Response({'liked': liked, 'total_likes': post.total_likes()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([CommentCreateThrottle])
def api_add_comment(request, post_id):
    try:
        post = SongOfTheDay.objects.get(id=post_id)
    except SongOfTheDay.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Content required'}, status=status.HTTP_400_BAD_REQUEST)
    parent_id = request.data.get('parent_id')
    parent = None
    if parent_id:
        try:
            parent = Comment.objects.get(id=parent_id, post=post)
        except Comment.DoesNotExist:
            pass
    comment = Comment.objects.create(user=request.user, post=post, content=content, parent=parent)
    return Response(CommentSerializer(comment, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([LikeThrottle])
def api_like_comment(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.user in comment.likes.all():
        comment.likes.remove(request.user)
        liked = False
    else:
        comment.likes.add(request.user)
        liked = True
    return Response({'liked': liked, 'total_likes': comment.total_likes()})


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_comment_detail(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

    if comment.user != request.user:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Content required'}, status=status.HTTP_400_BAD_REQUEST)
    comment.content = content
    comment.save()
    return Response(CommentSerializer(comment, context={'request': request}).data)


# ─── Profiles ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_profiles(request):
    profiles = Profile.objects.exclude(user=request.user)
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(profiles, request)
    serializer = ProfileSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_profile_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    profile = user.profile

    if request.method == 'PATCH':
        if request.user.id != user_id:
            return Response({'error': 'Cannot edit another user\'s profile'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    is_following = request.user.profile in profile.followers.all()
    return Response({
        **ProfileSerializer(profile).data,
        'is_following': is_following,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_follow_unfollow(request, user_id):
    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    profile_to_follow = target.profile
    my_profile = request.user.profile
    if my_profile in profile_to_follow.followers.all():
        profile_to_follow.followers.remove(my_profile)
        following = False
    else:
        profile_to_follow.followers.add(my_profile)
        following = True
    return Response({'following': following, 'total_followers': profile_to_follow.total_followers()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_followers(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    profiles = user.profile.followers.all()
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(profiles, request)
    return paginator.get_paginated_response(ProfileSerializer(page, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_following(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    profiles = user.profile.following.all()
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(profiles, request)
    return paginator.get_paginated_response(ProfileSerializer(page, many=True).data)


# ─── Spotify ──────────────────────────────────────────────────────────────────

def _spotify_client_token():
    """Get a Spotify client credentials token (for search, no user auth required)."""
    client_id = os.environ.get('SPOTIFY_CLIENT_ID', '')
    client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        return None
    resp = requests.post(
        'https://accounts.spotify.com/api/token',
        data={'grant_type': 'client_credentials'},
        auth=(client_id, client_secret),
        timeout=10,
    )
    if resp.ok:
        return resp.json().get('access_token')
    return None


def _refresh_user_token(spotify_token):
    """Refresh a user's Spotify access token using stored refresh token."""
    client_id = os.environ.get('SPOTIFY_CLIENT_ID', '')
    client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET', '')
    resp = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'refresh_token',
            'refresh_token': spotify_token.refresh_token,
        },
        auth=(client_id, client_secret),
        timeout=10,
    )
    if resp.ok:
        data = resp.json()
        spotify_token.access_token = data['access_token']
        spotify_token.expires_at = timezone.now() + timedelta(seconds=data.get('expires_in', 3600))
        if 'refresh_token' in data:
            spotify_token.refresh_token = data['refresh_token']
        spotify_token.save()
        return spotify_token.access_token
    return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_search(request):
    """Search Spotify catalog using client credentials (no user auth required)."""
    query = request.query_params.get('q', '')
    search_type = request.query_params.get('type', 'track')
    # Spotify caps the search limit at 10 for client-credentials (app) tokens;
    # anything higher returns 400 "Invalid limit".
    limit = min(int(request.query_params.get('limit', 10)), 10)

    if not query:
        return Response({'error': 'q parameter required'}, status=status.HTTP_400_BAD_REQUEST)

    token = _spotify_client_token()
    if not token:
        return Response(
            {'error': 'Spotify not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        resp = requests.get(
            'https://api.spotify.com/v1/search',
            params={'q': query, 'type': search_type, 'limit': limit, 'market': 'US'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=10,
        )
    except requests.RequestException as exc:
        return Response(
            {'error': f'Could not reach Spotify: {exc}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if resp.ok:
        return Response(resp.json())

    # Surface Spotify's actual error so the client can show something useful.
    try:
        detail = resp.json().get('error', {}).get('message', resp.text)
    except ValueError:
        detail = resp.text
    return Response({'error': f'Spotify search failed: {detail}'}, status=resp.status_code)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_auth_url(request):
    """Return the Spotify OAuth authorization URL for the mobile app."""
    client_id = os.environ.get('SPOTIFY_CLIENT_ID', '')
    redirect_uri = os.environ.get('SPOTIFY_REDIRECT_URI', 'sonora://spotify-callback')
    scopes = ' '.join([
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative',
        'streaming',
        'user-modify-playback-state',
        'user-read-playback-state',
    ])
    params = {
        'client_id': client_id,
        'response_type': 'code',
        'redirect_uri': redirect_uri,
        'scope': scopes,
        'show_dialog': 'false',
    }
    url = 'https://accounts.spotify.com/authorize?' + urllib.parse.urlencode(params)
    return Response({'url': url})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def spotify_exchange_token(request):
    """Exchange Spotify auth code for tokens using PKCE (mobile) or client secret (web)."""
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri', os.environ.get('SPOTIFY_REDIRECT_URI', ''))
    code_verifier = request.data.get('code_verifier')
    if not code:
        return Response({'error': 'code required'}, status=status.HTTP_400_BAD_REQUEST)

    client_id = os.environ.get('SPOTIFY_CLIENT_ID', '')

    if code_verifier:
        # PKCE flow (mobile): verifier instead of client secret
        resp = requests.post(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': client_id,
                'code_verifier': code_verifier,
            },
            timeout=10,
        )
    else:
        # Authorization Code flow (web): client secret via Basic Auth
        client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET', '')
        resp = requests.post(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
            },
            auth=(client_id, client_secret),
            timeout=10,
        )
    if not resp.ok:
        return Response({'error': 'Token exchange failed', 'detail': resp.text}, status=resp.status_code)

    data = resp.json()
    expires_at = timezone.now() + timedelta(seconds=data.get('expires_in', 3600))
    SpotifyToken.objects.update_or_create(
        user=request.user,
        defaults={
            'access_token': data['access_token'],
            'refresh_token': data.get('refresh_token', ''),
            'expires_at': expires_at,
            'scope': data.get('scope', ''),
        },
    )
    return Response({'status': 'connected', 'scope': data.get('scope', '')})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_status(request):
    """Check if the current user has connected Spotify."""
    try:
        token = request.user.spotify_token
        return Response({'connected': True, 'scope': token.scope})
    except SpotifyToken.DoesNotExist:
        return Response({'connected': False})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def spotify_disconnect(request):
    """Remove stored Spotify tokens for this user."""
    SpotifyToken.objects.filter(user=request.user).delete()
    return Response({'status': 'disconnected'})


def _get_user_spotify_token(user):
    """Return a valid Spotify access token for this user, refreshing if needed."""
    try:
        st = user.spotify_token
    except SpotifyToken.DoesNotExist:
        return None
    if st.is_expired():
        return _refresh_user_token(st)
    return st.access_token


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_user_playlists(request):
    """Fetch the authenticated user's Spotify playlists."""
    token = _get_user_spotify_token(request.user)
    if not token:
        return Response({'error': 'Spotify not connected'}, status=status.HTTP_401_UNAUTHORIZED)

    resp = requests.get(
        'https://api.spotify.com/v1/me/playlists',
        params={'limit': 50},
        headers={'Authorization': f'Bearer {token}'},
        timeout=10,
    )
    if resp.ok:
        return Response(resp.json())
    return Response({'error': 'Failed to fetch playlists'}, status=resp.status_code)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def spotify_import_playlist(request):
    """
    Import tracks from a Spotify playlist into a new (or existing) Sonora playlist.
    Body: { spotify_playlist_id, name (optional), create_new (bool) }
    """
    spotify_playlist_id = request.data.get('spotify_playlist_id')
    if not spotify_playlist_id:
        return Response({'error': 'spotify_playlist_id required'}, status=status.HTTP_400_BAD_REQUEST)

    token = _get_user_spotify_token(request.user)
    if not token:
        # Fall back to client credentials for public playlists
        token = _spotify_client_token()
    if not token:
        return Response({'error': 'Spotify not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    # Fetch playlist info
    pl_resp = requests.get(
        f'https://api.spotify.com/v1/playlists/{spotify_playlist_id}',
        headers={'Authorization': f'Bearer {token}'},
        timeout=10,
    )
    if not pl_resp.ok:
        return Response({'error': 'Could not fetch Spotify playlist'}, status=pl_resp.status_code)

    pl_data = pl_resp.json()
    playlist_name = request.data.get('name') or pl_data.get('name', 'Imported Playlist')

    # Create Sonora playlist
    playlist = Playlist.objects.create(
        user=request.user,
        name=playlist_name,
        description=f"Imported from Spotify: {pl_data.get('description', '')}",
        visibility='PRIVATE',
        playlist_cover=pl_data.get('images', [{}])[0].get('url'),
    )

    # Fetch all tracks (paginated). The first call carries query params; the
    # `next` URL returned by Spotify already includes its own params, so we must
    # NOT re-attach them on subsequent calls.
    imported = 0
    tracks_url = f'https://api.spotify.com/v1/playlists/{spotify_playlist_id}/tracks'
    params = {'limit': 100, 'market': 'US', 'additional_types': 'track'}
    while tracks_url:
        tr_resp = requests.get(
            tracks_url,
            params=params,
            headers={'Authorization': f'Bearer {token}'},
            timeout=10,
        )
        params = None  # subsequent `next` URLs are already fully-formed
        if not tr_resp.ok:
            break
        tr_data = tr_resp.json()
        for item in tr_data.get('items', []):
            track = item.get('track')
            # Skip podcasts, local files, and unavailable tracks (no id).
            if not track or track.get('type') != 'track' or not track.get('id'):
                continue
            # Match or create Song by spotify_track_id
            song, _ = Song.objects.get_or_create(
                spotify_track_id=track['id'],
                defaults={
                    'title': track['name'],
                    'artist': ', '.join(a['name'] for a in track.get('artists', [])),
                    'album': track.get('album', {}).get('name', ''),
                    'duration': timedelta(milliseconds=track.get('duration_ms', 0)),
                    'album_cover': (track.get('album', {}).get('images') or [{}])[0].get('url'),
                    'preview_url': track.get('preview_url'),
                    'genre': 'OTHER',
                },
            )
            playlist.songs.add(song)
            imported += 1
        tracks_url = tr_data.get('next')

    return Response({
        'playlist_id': playlist.id,
        'name': playlist.name,
        'imported_tracks': imported,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def spotify_web_callback(request):
    """
    Handles the Spotify OAuth redirect for the web app.
    Spotify redirects here with ?code=... after user authorization.
    We exchange the code, store the token (if user is authenticated via JWT
    in the session cookie), then redirect back to the frontend.
    """
    from django.shortcuts import redirect as django_redirect
    from rest_framework_simplejwt.authentication import JWTAuthentication

    code = request.query_params.get('code')
    error = request.query_params.get('error')
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

    if error or not code:
        return django_redirect(f'{frontend_url}/profile?spotify=error')

    # Try to identify the user from the JWT passed in state param
    state = request.query_params.get('state', '')
    user = None
    if state:
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            token_obj = AccessToken(state)
            from django.contrib.auth.models import User as DjangoUser
            user = DjangoUser.objects.get(id=token_obj['user_id'])
        except Exception:
            pass

    if not user:
        return django_redirect(f'{frontend_url}/profile?spotify=error&reason=unauthenticated')

    redirect_uri = os.environ.get('SPOTIFY_WEB_REDIRECT_URI',
                                  f'{request.scheme}://{request.get_host()}/api/spotify/web-callback/')
    client_id = os.environ.get('SPOTIFY_CLIENT_ID', '')
    client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET', '')

    resp = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
        },
        auth=(client_id, client_secret),
        timeout=10,
    )

    if not resp.ok:
        return django_redirect(f'{frontend_url}/profile?spotify=error')

    data = resp.json()
    expires_at = timezone.now() + timedelta(seconds=data.get('expires_in', 3600))
    SpotifyToken.objects.update_or_create(
        user=user,
        defaults={
            'access_token': data['access_token'],
            'refresh_token': data.get('refresh_token', ''),
            'expires_at': expires_at,
            'scope': data.get('scope', ''),
        },
    )
    return django_redirect(f'{frontend_url}/profile?spotify=connected')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_web_auth_url(request):
    """Return the Spotify OAuth URL for the web app, using the backend redirect URI."""
    client_id = os.environ.get('SPOTIFY_CLIENT_ID', '')
    redirect_uri = os.environ.get(
        'SPOTIFY_WEB_REDIRECT_URI',
        f'{request.scheme}://{request.get_host()}/api/spotify/web-callback/',
    )
    scopes = ' '.join([
        'user-read-private', 'user-read-email',
        'playlist-read-private', 'playlist-read-collaborative',
    ])
    # Pass the user's JWT access token as state so we can identify them on callback
    from rest_framework_simplejwt.tokens import AccessToken
    state = str(AccessToken.for_user(request.user))

    params = {
        'client_id': client_id,
        'response_type': 'code',
        'redirect_uri': redirect_uri,
        'scope': scopes,
        'state': state,
    }
    url = 'https://accounts.spotify.com/authorize?' + urllib.parse.urlencode(params)
    return Response({'url': url, 'redirect_uri': redirect_uri})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_track_detail(request, track_id):
    """Fetch a single Spotify track's details."""
    token = _spotify_client_token()
    if not token:
        return Response({'error': 'Spotify not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    resp = requests.get(
        f'https://api.spotify.com/v1/tracks/{track_id}',
        headers={'Authorization': f'Bearer {token}'},
        timeout=10,
    )
    if resp.ok:
        return Response(resp.json())
    return Response({'error': 'Track not found'}, status=resp.status_code)


# ─── Image Upload ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_upload_image(request):
    """Upload an image to S3 and return the URL. Field name: 'image'. Optional: 'folder' (profile_pictures|album_covers|playlist_covers)."""
    image = request.FILES.get('image')
    if not image:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    bucket = os.environ.get('S3_BUCKET')
    base_url = os.environ.get('S3_BASE_URL', 'https://s3.amazonaws.com/')
    if not bucket:
        return Response({'error': 'S3 not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    folder = request.data.get('folder', 'uploads')
    ext = image.name[image.name.rfind('.'):] if '.' in image.name else ''
    key = f"{folder}/{uuid.uuid4().hex}{ext}"

    try:
        s3 = boto3.client('s3')
        s3.upload_fileobj(image, bucket, key, ExtraArgs={'ContentType': image.content_type})
        url = f"{base_url}{bucket}/{key}"
        return Response({'url': url})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
