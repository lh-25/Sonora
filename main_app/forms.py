from django import forms
from .models import Song
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class SignupForm(UserCreationForm):
    email = forms.EmailField(required=True)
    profile_picture = forms.ImageField(required=False, label="Upload Profile Picture")
    bio = forms.CharField(required=False, max_length=500, widget=forms.Textarea(attrs={
        'placeholder': 'Write a short bio about yourself',
        'rows': 3
    }))
    class Meta:
        model = User
        fields = ('username', 'email', 'profile_picture','bio')

class SongForm(forms.ModelForm):
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
            )
        }