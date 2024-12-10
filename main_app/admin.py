from django.contrib import admin
from .models import Song, SongOfTheDay, Playlist

# Register your models here.
admin.site.register(Song),
admin.site.register(SongOfTheDay),
admin.site.register(Playlist)