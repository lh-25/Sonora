from django.db import models
from django.urls import reverse
from django.contrib.auth.models import User

VISIBILITY_CHOICES = [
  ('PUBLIC', 'Public'),
  ('PRIVATE', 'Private')
]
GENRE_CHOICES = [
    ('POP', 'Pop'),
    ('ROCK', 'Rock'),
    ('RAP', 'Rap'),
    ('JAZZ', 'Jazz'),
    ('CLASSICAL', 'Classical'),
    ('RNB', 'R&B'),
    ('COUNTRY', 'Country'),
    ('ELECTRONIC', 'Electronic'),
    ('OTHER', 'Other'),
]

# Create your models here.
class Song(models.Model):
  title = models.CharField(max_length=255)
  artist = models.CharField(max_length=255)
  album = models.CharField(max_length=255, null=True, blank=True)
  genre = models.CharField(max_length=50, choices=GENRE_CHOICES, default='OTHER')
  release_date = models.DateField(null=True, blank=True)
  duration = models.DurationField()
  album_cover = models.ImageField(upload_to='songs/images/',null=True, blank=True)
  class Meta:
    ordering = ['title', 'artist'] 
  def __str__(self):
    return f'{self.title} by {self.artist}'
  def get_absolute_url(self):
        return reverse('song-detail', kwargs={'pk': self.pk})


class Playlist(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playlists')
  name = models.CharField(max_length=255)
  description = models.TextField(null=True, blank=True)
  visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='PRIVATE')
  date_created = models.DateTimeField(auto_now_add=True)
  playlist_cover = models.ImageField(upload_to='playlists/covers/',null=True, blank=True)
  songs = models.ManyToManyField(Song, related_name='playlists')
  
  def __str__(self):
    return f'{self.name} by {self.user.username}'
  class Meta:
    ordering = ['-date_created', 'name']
    
  def get_absolute_url(self):
        return reverse('playlist-detail', kwargs={'playlist_id': self.id})


class SongOfTheDay(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE,related_name='posts')
  song = models.ForeignKey(Song,on_delete=models.CASCADE)
  post_title = models.CharField(max_length=255)
  reason_for_pick = models.TextField()
  standout_lyric = models.CharField(max_length=500)
  date_posted = models.DateTimeField(auto_now_add=True)
  post_image = models.ImageField(upload_to='song_of_the_day/posts/',null=True, blank=True)
  
  def __str__(self):
    return f'Song of the Day by{self.user.username}:  {self.post_title}'
  class Meta:
    ordering = ['-date_posted']
    
  def get_absolute_url(self):
        return reverse('song-of-the-day-detail', kwargs={'post_id': self.id})

  
