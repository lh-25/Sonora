from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
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
  playlists = Playlist.objects.all()
  return render(request, 'playlists/playlist_index.html', {'playlists': playlists})


def my_playlists(request):
  playlists = Playlist.objects.filter(user=request.user)
  return render(request, 'playlists/my_playlists.html',{'playlists': playlists})

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
 return render(request, 'song_of_the_day/song_of_the_day_index.html', {'posts': posts})

def my_posts(request):
  posts = SongOfTheDay.objects.filter(user=request.user)
  return render(request, 'song_of_the_day/my_posts.html',{'posts': posts})

def songoftheday_details(request, post_id):
  post = SongOfTheDay.objects.get(id=post_id)
  return render(request, 'song_of_the_day/song_of_the_day_detail.html', {'post': post})

