from django import forms
from .models import Song, Profile, Comment, Playlist, SongOfTheDay
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class SignupForm(UserCreationForm):
    email = forms.EmailField(required=True)
    profile_picture = forms.FileField(required=False, label="Upload Profile Picture")
    bio = forms.CharField(required=False, max_length=500, widget=forms.Textarea(attrs={
        'placeholder': 'Write a short bio about yourself',
        'rows': 3
    }))
    class Meta:
        model = User
        fields = ('username', 'email', 'profile_picture','bio')

class SongForm(forms.ModelForm):
    album_cover = forms.FileField()
    class Meta:
        model = Song
        fields = '__all__'
       
        widgets = {
            'release_date': forms.DateInput(
                format=('%Y-%m-%d'),
                attrs={
                    'placeholder': 'Select a date',
                    'type': 'date'
                }
            ),
            
        }
        
class PlaylistForm(forms.ModelForm):
    playlist_cover = forms.FileField()
    class Meta:
        model = Playlist
        fields = ['name', 'description', 'visibility', 'playlist_cover', 'songs']
    
class SongOfTheDayForm(forms.ModelForm):
    post_image = forms.FileField()
    class Meta:
        model = SongOfTheDay
        fields = ['song', 'post_title', 'reason_for_pick', 'post_image', 'standout_lyric']
        
class ProfileForm(forms.ModelForm):
    profile_picture = forms.FileField()
    class Meta:
        model = Profile
        fields = ['bio', 'profile_picture']
        widgets = {
            'profile_picture': forms.ClearableFileInput(attrs={'class': 'file-input'}),
        }
        
class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'rows': 3,
                'placeholder': 'Write your comment here...'
            })
        }
        labels = {
            'content': 'Comment',
        }
