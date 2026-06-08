from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Song, Playlist, SongOfTheDay, Comment, Profile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    total_followers = serializers.SerializerMethodField()
    total_following = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'user', 'profile_picture', 'bio', 'total_followers', 'total_following']

    def get_total_followers(self, obj):
        return obj.total_followers()

    def get_total_following(self, obj):
        return obj.total_following()


class SongSerializer(serializers.ModelSerializer):
    formatted_duration = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = [
            'id', 'title', 'artist', 'album', 'genre', 'release_date',
            'duration', 'formatted_duration', 'album_cover',
            'spotify_track_id', 'preview_url',
        ]

    def get_formatted_duration(self, obj):
        return obj.formatted_duration()


class PlaylistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    songs = SongSerializer(many=True, read_only=True)
    song_count = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = [
            'id', 'user', 'name', 'description', 'visibility',
            'date_created', 'playlist_cover', 'songs', 'song_count',
        ]

    def get_song_count(self, obj):
        return obj.songs.count()


class PlaylistCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ['id', 'name', 'description', 'visibility', 'playlist_cover']


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    total_likes = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'content', 'date_posted', 'parent',
            'total_likes', 'is_liked', 'replies',
        ]

    def get_total_likes(self, obj):
        return obj.total_likes()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.likes.all()
        return False

    def get_replies(self, obj):
        if obj.parent is None:
            serializer = CommentSerializer(
                obj.replies.all(), many=True, context=self.context
            )
            return serializer.data
        return []


class SongOfTheDaySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    song = SongSerializer(read_only=True)
    song_id = serializers.PrimaryKeyRelatedField(
        queryset=Song.objects.all(), source='song', write_only=True
    )
    total_likes = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = SongOfTheDay
        fields = [
            'id', 'user', 'song', 'song_id', 'post_title', 'reason_for_pick',
            'standout_lyric', 'date_posted', 'post_image',
            'total_likes', 'is_liked', 'comment_count',
        ]

    def get_total_likes(self, obj):
        return obj.total_likes()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.likes.all()
        return False

    def get_comment_count(self, obj):
        return obj.comments.count()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    bio = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'bio']

    def create(self, validated_data):
        bio = validated_data.pop('bio', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        Profile.objects.create(user=user, bio=bio)
        return user
