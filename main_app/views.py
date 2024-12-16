from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
import uuid
import boto3
import os
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
from .forms import SignupForm, SongForm, CommentForm

# Create your views here.
def signup(request):
  error_message = ''
  if request.method == 'POST':
      form = SignupForm(request.POST, request.FILES)
      if form.is_valid():
          user = form.save()
          profile_picture = form.cleaned_data.get('profile_picture')
          bio = form.cleaned_data.get('bio', '')
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
  
  
# User/Profile Views

@login_required  
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
  
@login_required   
def user_profiles(request):
  users = User.objects.exclude(id=request.user.id)
  profiles = {user.id: user.profile for user in users}

  return render(request, 'users/profiles.html', {'users': users, 'profiles': profiles})

@login_required 
def profile(request, user_id):
  user = User.objects.get(id=user_id)
  profile = user.profile 
  posts = user.posts.all()
  playlists = user.playlists.filter(visibility='PUBLIC')

  return render(request, 'users/profile.html', {
        'user': user,
        'profile': profile,
        'posts': posts,
        'playlists': playlists,
    })

class ProfileUpdate( LoginRequiredMixin, UpdateView):
    model = Profile
    fields = ['profile_picture', 'bio']
    template_name = 'main_app/edit_profile.html'
    def get_object(self,):
      return self.model.objects.get(user=self.request.user)
    def get_success_url(self):
      return reverse('my-profile') 


@login_required 
def followers(request, username):
    user = get_object_or_404(User, username=username)
    followers = user.profile.followers.all() 
    return render(request, 'users/followers.html', {'user': user, 'followers': followers})

@login_required 
def following(request, username):
    user = get_object_or_404(User, username=username)
    following = user.profile.following.all() 
    return render(request, 'users/following.html', {'user': user, 'following': following})

@login_required   
def follow_unfollow(request, username):
    profile_to_follow = get_object_or_404(Profile, user__username=username)
    if request.user.profile in profile_to_follow.followers.all():
        profile_to_follow.followers.remove(request.user.profile)
    else:
        profile_to_follow.followers.add(request.user.profile)
    return redirect('profile', user_id=profile_to_follow.user.id) 
  
# Song Views
@login_required 
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
    
@login_required 
def song_detail(request, song_id):
  song = Song.objects.get(id=song_id)
  return render(request, 'songs/detail.html', {'song': song})
  
class SongCreate(LoginRequiredMixin, CreateView):
  model = Song
  form_class = SongForm
  def form_valid(self, form):
    song = form.save(commit=False)
    print(song)
    # def add_photo(request, song_id):
    album_cover = self.request.FILES.get('album_cover', None)
    if album_cover:
        s3 = boto3.client('s3')
        key = uuid.uuid4().hex[:6] + album_cover.name[album_cover.name.rfind('.'):]
        try:
            bucket = os.environ['S3_BUCKET']
            s3.upload_fileobj(album_cover, bucket, key)
            url = f"{os.environ['S3_BASE_URL']}{bucket}/{key}"
            song.album_cover=url 
        except Exception as e:
            print('An error occurred uploading file to S3')
            print(e)
    song.save()
    # return redirect('song-detail', song_id=song_id)
    return super().form_valid(form)
  
  
  

@login_required  
def add_to_playlist(request, song_id):
    song = get_object_or_404(Song, id=song_id)
    if request.method == 'POST':
        playlist_id = request.POST.get('playlist')
        playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
        playlist.songs.add(song)
        messages.success(request, f'{song.title} has been added to {playlist.name}!')
    return redirect('playlist-detail', playlist_id=playlist.id)
  
class SongOfTheDayCreateView(LoginRequiredMixin, CreateView):
    model = SongOfTheDay
    fields = ['post_title', 'reason_for_pick', 'standout_lyric', 'post_image']
    template_name = 'main_app/songoftheday_form.html'

    def form_valid(self, form):
        song = get_object_or_404(Song, id=self.kwargs['song_id'])
        form.instance.user = self.request.user
        form.instance.song = song
        return super().form_valid(form)
  
# Playlist Views

class PlaylistCreate(LoginRequiredMixin, CreateView):
  model = Playlist
  fields = ['name', 'description', 'visibility', 'playlist_cover', 'songs']
  def form_valid(self, form):
        form.instance.user = self.request.user 
        return super().form_valid(form)

class PlaylistUpdate(LoginRequiredMixin, UpdateView):
  model = Playlist
  fields = ['name', 'description', 'visibility', 'playlist_cover', 'songs']
  
class PlaylistDelete(LoginRequiredMixin, DeleteView):
  model = Playlist
  success_url ='/playlists/my-playlists/'
  
@login_required 
def playlist_index(request):
  page = request.GET.get('page', 1) 
  playlists = Playlist.objects.filter(visibility='PUBLIC')
  paginator = Paginator(playlists, 10) 
  playlists_page = paginator.get_page(page)
  return render(request, 'playlists/playlist_index.html', {'playlists': playlists_page})

@login_required 
def my_playlists(request):
  page = request.GET.get('page', 1)  
  playlists = Playlist.objects.filter(user=request.user)
  paginator = Paginator(playlists, 10)
  playlists_page = paginator.get_page(page) 
  return render(request, 'playlists/my_playlists.html',{'playlists': playlists_page})

@login_required 
def playlist_details(request, playlist_id):
  playlist = Playlist.objects.get(id=playlist_id)
  return render(request, 'playlists/playlist_detail.html', {'playlist': playlist})

@login_required 
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

class SongOfTheDayCreate(LoginRequiredMixin, CreateView):
  model = SongOfTheDay
  fields = ['song', 'post_title', 'reason_for_pick', 'post_image', 'standout_lyric']
  def form_valid(self, form):
        form.instance.user = self.request.user 
        return super().form_valid(form)

class SongOfTheDayUpdate(LoginRequiredMixin, UpdateView):
  model = SongOfTheDay
  fields = ['song', 'post_title', 'reason_for_pick', 'post_image', 'standout_lyric']
  
class SongOfTheDayDelete(LoginRequiredMixin, DeleteView):
  model = SongOfTheDay
  success_url ='/song_of_the_day/my-posts/'

@login_required 
def songoftheday_index(request):
  posts = SongOfTheDay.objects.all()
  page = request.GET.get('page', 1) 
  paginator = Paginator(posts, 10)
  posts_page = paginator.get_page(page)
  return render(request, 'song_of_the_day/song_of_the_day_index.html', {'posts': posts_page})

@login_required 
def my_posts(request):  
  posts = SongOfTheDay.objects.filter(user=request.user)
  page = request.GET.get('page', 1) 
  paginator = Paginator(posts, 10)
  posts_page = paginator.get_page(page)
  return render(request, 'song_of_the_day/my_posts.html',{'posts': posts_page})

@login_required 
def songoftheday_details(request, post_id):
    post = get_object_or_404(SongOfTheDay, id=post_id)
    top_level_comments = post.comments.filter(parent=None)
    form = CommentForm()

    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.user = request.user
            comment.post = post
            parent_id = request.POST.get('parent_id')
            if parent_id:
                comment.parent = Comment.objects.get(id=parent_id)
            comment.save()
            return redirect(post.get_absolute_url()) 
    return render(
        request,
        'song_of_the_day/song_of_the_day_detail.html',
        {
            'post': post,
            'top_level_comments': top_level_comments,
            'form': form,
        }
    )

@login_required 
def like_post(request, post_id):
    post = get_object_or_404(SongOfTheDay, id=post_id)
    if request.user in post.likes.all():
        post.likes.remove(request.user) 
    else:
        post.likes.add(request.user) 
    return redirect('song_of_the_day_detail', post_id=post_id)
  
@login_required 
def like_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    if request.user in comment.likes.all():
        comment.likes.remove(request.user) 
    else:
        comment.likes.add(request.user) 
    return redirect(comment.post.get_absolute_url())

      
class CommentUpdate(LoginRequiredMixin, UpdateView):
    model = Comment
    fields = ['content']
    template_name = 'main_app/comment_form.html' 

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def get_success_url(self):
        return self.object.post.get_absolute_url()
      
      
class CommentDelete(LoginRequiredMixin, DeleteView):
    model = Comment
    template_name = 'main_app/comment_confirm_delete.html'

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def get_success_url(self):
        return self.object.post.get_absolute_url()