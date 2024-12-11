from django.shortcuts import render, redirect
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.views.generic import DetailView
from django.contrib.auth.views import LoginView
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Song, Playlist, SongOfTheDay
from .forms import SignupForm
# Create your views here.
def signup(request):
    error_message = ''
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('song-index')
        else:
            error_message = 'Invalid sign up - try again'
    form = SignupForm()
    context = {'form': form, 'error_message': error_message}
    return render(request, 'signup.html', context)
  
class Home(LoginView):
  template_name = 'home.html'
  
def about(request):
    return render(request, 'about.html')
  
# Song Views
def song_index(request):
  songs = Song.objects.all()
  return render(request, 'songs/index.html', {'songs': songs})
  
def song_detail(request, song_id):
  song = Song.objects.get(id=song_id)
  return render(request, 'songs/detail.html', {'song': song})
  
class SongCreate(CreateView):
  model = Song
  fields = '__all__'
  
# Playlist Views

class PlaylistCreate(CreateView):
  model = Playlist
  fields = ['name', 'description', 'visibility', 'playlist_cover', 'songs']

class PlaylistUpdate(UpdateView):
  model = Playlist
  fields = ['name', 'description', 'visibility', 'playlist_cover', 'songs']
  
class PlaylistDelete(DeleteView):
  model = Playlist
  success_url ='/playlist/my-playlist/'

def playlist_index(request):
  playlists = Playlist.objects.all()
  return render(request, 'playlists/playlist_index.html', {'playlists': playlists})


def my_playlists(request):
  playlists = Playlist.objects.filter(user=request.user)
  return render(request, 'playlists/my_playlists.html',{'playlists': playlists})

def playlist_details(request, playlist_id):
  playlist = Playlist.objects.get(id=playlist_id)
  return render(request, 'playlists/playlist_detail.html', {'playlist': playlist})


# Song of the Day Views

class SongOfTheDayCreate(CreateView):
  model = SongOfTheDay
  fields = ['song', 'post_title', 'reason_for_pick', 'post_image', 'standout_lyric']

class SongOfTheDayUpdate(UpdateView):
  model = SongOfTheDay
  fields = ['song', 'post_title', 'reason_for_pick', 'post_image', 'standout_lyric']
  
class SongOfTheDayDelete(DeleteView):
  model = SongOfTheDay
  success_url ='/song_of_the_day/my-posts/'

def songoftheday_index(request):
 posts = SongOfTheDay.objects.all()
 return render(request, 'song_of_the_day/song_of_the_day_index.html', {'posts': posts})

def my_posts(request):
  posts = SongOfTheDay.objects.filter(user=request.user)
  return render(request, 'song_of_the_day/my_posts.html',{'posts': posts})

def songoftheday_details(request, post_id):
  post = SongOfTheDay.objects.get(id=post_id)
  return render(request, 'song_of_the_day/song_of_the_day_detail.html', {'post': post})

