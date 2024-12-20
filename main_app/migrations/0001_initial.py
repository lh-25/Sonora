# Generated by Django 5.1.4 on 2024-12-10 17:31

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Song',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('artist', models.CharField(max_length=255)),
                ('album', models.CharField(blank=True, max_length=255, null=True)),
                ('genre', models.CharField(max_length=100)),
                ('release_date', models.DateField(blank=True, null=True)),
                ('duration', models.DurationField()),
                ('album_cover', models.ImageField(blank=True, null=True, upload_to='songs/images/')),
            ],
            options={
                'ordering': ['title', 'artist'],
            },
        ),
        migrations.CreateModel(
            name='Playlist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('visibility', models.CharField(choices=[('PUBLIC', 'Public'), ('PRIVATE', 'Private')], default='PRIVATE', max_length=10)),
                ('date_created', models.DateTimeField(auto_now_add=True)),
                ('playlist_cover', models.ImageField(blank=True, null=True, upload_to='playlists/covers/')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='playlists', to=settings.AUTH_USER_MODEL)),
                ('songs', models.ManyToManyField(related_name='playlists', to='main_app.song')),
            ],
            options={
                'ordering': ['-date_created', 'name'],
            },
        ),
        migrations.CreateModel(
            name='SongOfTheDay',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('post_title', models.CharField(max_length=255)),
                ('reason_for_pick', models.TextField()),
                ('standout_lyric', models.CharField(max_length=500)),
                ('date_posted', models.DateTimeField(auto_now_add=True)),
                ('post_image', models.ImageField(blank=True, null=True, upload_to='song_of_the_day/posts/')),
                ('song', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='main_app.song')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date_posted'],
            },
        ),
    ]
