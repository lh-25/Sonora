from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Q
from django.urls import reverse
from django.core.paginator import Paginator
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.contrib.auth.views import LoginView
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Song, Playlist, SongOfTheDay, Comment, Profile
from django.contrib.auth.models import User
from .forms import SignupForm, SongForm

# Create your views here.
def signup(request):
  error_message = ''
  if request.method == 'POST':
      form = SignupForm(request.POST, request.FILES)
      if form.is_valid():
          user = form.save()
          profile_picture = form.cleaned_data.get('profile_picture')
          bio = form.cleaned_data.get('bio', '')

            # Create a profile
          Profile.objects.create(user=user, profile_picture=profile_picture, bio=bio)
          login(request, user)
          return redirect('song-index')
  else:
    error_message = 'Invalid sign up - try again'
  form = SignupForm()
  context = {'form': form, 'error_message': error_message}
  return render(request, 'signup.html', context)
  
  
class Home(LoginView):
  template_name = 'home.html'

def landing_page(request):
  return render(request, 'landing_page.html')

def about(request):
    return render(request, 'about.html')
  
def my_profile(request):
  user = User.objects.get(id=request.user.id)
  profile = user.profile
  playlists_count = request.user.playlists.count()
  posts_count = request.user.posts.count()
  followers_count = profile.total_followers()
  following_count = profile.total_following()
  return render(request, 'users/my-profile.html', {'user': user,
        'profile': profile,
        'playlists_count': playlists_count,
        'posts_count': posts_count,
        'followers_count': followers_count,
        'following_count': following_count,}) 
  
def user_profiles(request):
  users = User.objects.exclude(id=request.user.id)
  profiles = {user.id: user.profile for user in users}

  return render(request, 'users/profiles.html', {'users': users, 'profiles': profiles})

def profile(request, user_id):
  user = User.objects.get(id=user_id)
  profile = user.profile  # Fetch the profile of the user
  posts = user.posts.all()
  playlists = user.playlists.filter(visibility='PUBLIC')

  return render(request, 'users/profile.html', {
        'user': user,
        'profile': profile,
        'posts': posts,
        'playlists': playlists,
    })

class ProfileUpdate( UpdateView):
    model = Profile
    fields = ['profile_picture', 'bio']
    template_name = 'main_app/edit_profile.html'
    def get_object(self,):
      return self.model.objects.get(user=self.request.user)
    def get_success_url(self):
      return reverse('my-profile')  # Use the URL name directly without kwargs


def followers(request, username):
    user = get_object_or_404(User, username=username)
    followers = user.profile.followers.all()  # Get all followers of the user
    return render(request, 'users/followers.html', {'user': user, 'followers': followers})

def following(request, username):
    user = get_object_or_404(User, username=username)
    following = user.profile.following.all()  # Get all users the user is following
    return render(request, 'users/following.html', {'user': user, 'following': following})
  
def follow_unfollow(request, username):
    profile_to_follow = get_object_or_404(Profile, user__username=username)
    if request.user.profile in profile_to_follow.followers.all():
        # Unfollow
        profile_to_follow.followers.remove(request.user.profile)
    else:
        # Follow
        profile_to_follow.followers.add(request.user.profile)
    return redirect('profile', username=username) 
  
# Song Views
def song_index(request):
    genre = request.GET.get('genre', '')
    search_query = request.GET.get('search', '')
    page = request.GET.get('page', 1) 


    songs = Song.objects.all()

    if genre:
        songs = songs.filter(genre__iexact=genre)
    if search_query:
        songs = songs.filter(
            Q(title__icontains=search_query) |
            Q(artist__icontains=search_query) |
            Q(album__icontains=search_query)
        )
    paginator = Paginator(songs, 10) 
    songs_page = paginator.get_page(page)

    genre_choices = Song._meta.get_field('genre').choices

    return render(request, 'songs/index.html', {
        'songs': songs_page, 
        'genre_choices': genre_choices,
        'request': request,  
    })
  
def song_detail(request, song_id):
  song = Song.objects.get(id=song_id)
  return render(request, 'songs/detail.html', {'song': song})
  
class SongCreate(CreateView):
  model = Song
  form_class = SongForm

  
def add_to_playlist(request, song_id):
    song = get_object_or_404(Song, id=song_id)
    if request.method == 'POST':
        playlist_id = request.POST.get('playlist')
        playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
        playlist.songs.add(song)
        messages.success(request, f'{song.title} has been added to {playlist.name}!')
    return redirect('playlist-detail', playlist_id=playlist.id)
  
class SongOfTheDayCreateView(CreateView):
    model = SongOfTheDay
    fields = ['post_title', 'reason_for_pick', 'standout_lyric', 'post_image']
    template_name = 'main_app/songoftheday_form.html'

    def form_valid(self, form):
        song = get_object_or_404(Song, id=self.kwargs['song_id'])
        form.instance.user = self.request.user
        form.instance.song = song
        return super().form_valid(form)
  
# Playlist Views

class PlaylistCreate(CreateView):
  model = Playlist
  fields = ['name', 'description', 'visibility', 'playlist_cover', 'songs']
  def form_valid(self, form):
        form.instance.user = self.request.user 
        return super().form_valid(form)

class PlaylistUpdate(UpdateView):
  model = Playlist
  fields = ['name', 'description', 'visibility', 'playlist_cover', 'songs']
  
class PlaylistDelete(DeleteView):
  model = Playlist
  success_url ='/playlists/my-playlists/'

def playlist_index(request):
  page = request.GET.get('page', 1) 
  playlists = Playlist.objects.filter(visibility='PUBLIC')
  paginator = Paginator(playlists, 10) 
  playlists_page = paginator.get_page(page)
  return render(request, 'playlists/playlist_index.html', {'playlists': playlists_page})


def my_playlists(request):
  page = request.GET.get('page', 1)  
  playlists = Playlist.objects.filter(user=request.user)
  paginator = Paginator(playlists, 10)
  playlists_page = paginator.get_page(page) 
  return render(request, 'playlists/my_playlists.html',{'playlists': playlists_page})

def playlist_details(request, playlist_id):
  playlist = Playlist.objects.get(id=playlist_id)
  return render(request, 'playlists/playlist_detail.html', {'playlist': playlist})

def remove_from_playlist(request, playlist_id, song_id):
    playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
    song = get_object_or_404(Song, id=song_id)
    
    if song in playlist.songs.all():
        playlist.songs.remove(song)
        messages.success(request, f'{song.title} has been removed from {playlist.name}.')
    else:
        messages.error(request, f'{song.title} is not in {playlist.name}.')
    
    return redirect('playlist-detail', playlist_id=playlist.id)


# Song of the Day Views

class SongOfTheDayCreate(CreateView):
  model = SongOfTheDay
  fields = ['song', 'post_title', 'reason_for_pick', 'post_image', 'standout_lyric']
  def form_valid(self, form):
        form.instance.user = self.request.user 
        return super().form_valid(form)

class SongOfTheDayUpdate(UpdateView):
  model = SongOfTheDay
  fields = ['song', 'post_title', 'reason_for_pick', 'post_image', 'standout_lyric']
  
class SongOfTheDayDelete(DeleteView):
  model = SongOfTheDay
  success_url ='/song_of_the_day/my-posts/'

def songoftheday_index(request):
  posts = SongOfTheDay.objects.all()
  page = request.GET.get('page', 1) 
  paginator = Paginator(posts, 10)
  posts_page = paginator.get_page(page)
  return render(request, 'song_of_the_day/song_of_the_day_index.html', {'posts': posts_page})

def my_posts(request):  
  posts = SongOfTheDay.objects.filter(user=request.user)
  page = request.GET.get('page', 1) 
  paginator = Paginator(posts, 10)
  posts_page = paginator.get_page(page)
  return render(request, 'song_of_the_day/my_posts.html',{'posts': posts_page})

def songoftheday_details(request, post_id):
  post = SongOfTheDay.objects.get(id=post_id)
  top_level_comments = post.comments.filter(parent=None)
  return render(request, 'song_of_the_day/song_of_the_day_detail.html', {'post': post, 'top_level_comments': top_level_comments})

def like_post(request, post_id):
    post = get_object_or_404(SongOfTheDay, id=post_id)
    if request.user in post.likes.all():
        post.likes.remove(request.user)  # Unlike
    else:
        post.likes.add(request.user)  # Like
    return redirect('song_of_the_day_detail', post_id=post_id)
  

def like_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    # Toggle like/unlike
    if request.user in comment.likes.all():
        comment.likes.remove(request.user)  # Unlike
    else:
        comment.likes.add(request.user)  # Like
    # Redirect back to the post's detail page
    return redirect(comment.post.get_absolute_url())
  
  
  
class CommentCreate(CreateView):
    model = Comment
    fields = ['content']
    template_name = 'main_app/comment_form.html'

    def form_valid(self, form):
        post_id = self.kwargs['post_id']
        post = get_object_or_404(SongOfTheDay, id=post_id)
        form.instance.post = post
        form.instance.user = self.request.user

        # Check if the comment is a reply
        parent_id = self.request.POST.get('parent_id')
        if parent_id:
            parent_comment = get_object_or_404(Comment, id=parent_id)
            form.instance.parent = parent_comment

        return super().form_valid(form)

    def get_success_url(self):
        return self.object.post.get_absolute_url()
      
class CommentUpdate(UpdateView):
    model = Comment
    fields = ['content']
    template_name = 'main_app/comment_form.html'  # Reuse the same form template

    def get_queryset(self):
        # Ensure users can only edit their own comments
        return super().get_queryset().filter(user=self.request.user)

    def get_success_url(self):
        return self.object.post.get_absolute_url()
      
      
class CommentDelete(DeleteView):
    model = Comment
    template_name = 'main_app/comment_confirm_delete.html'

    def get_queryset(self):
        # Ensure users can only delete their own comments
        return super().get_queryset().filter(user=self.request.user)

    def get_success_url(self):
        return self.object.post.get_absolute_url()