"""Bulk-link library songs to Spotify tracks.

Usage:
  python manage.py link_spotify              # link every song missing a spotify_track_id
  python manage.py link_spotify --dry-run    # show what would be linked, change nothing
  python manage.py link_spotify --relink     # re-match songs that are already linked too

Searches Spotify (client credentials — no user auth needed) by title + artist
and saves the best match's track id. Also backfills album_cover and album
when missing.
"""

import time

import requests
from django.core.management.base import BaseCommand, CommandError

from main_app.api_views import _spotify_client_token
from main_app.models import Song

SEARCH_URL = 'https://api.spotify.com/v1/search'
# Spotify caps the search limit at 10 for client-credentials tokens.
SEARCH_LIMIT = 5


def _norm(s):
    return ''.join(ch for ch in (s or '').lower() if ch.isalnum() or ch == ' ').strip()


def _pick_match(song, items):
    """Prefer an exact (normalized) title + artist match; fall back to first result."""
    want_title = _norm(song.title)
    want_artist = _norm(song.artist)
    for track in items:
        names = [_norm(a.get('name')) for a in track.get('artists', [])]
        if _norm(track.get('name')) == want_title and any(
            want_artist in n or n in want_artist for n in names if n
        ):
            return track, True
    return (items[0], False) if items else (None, False)


class Command(BaseCommand):
    help = 'Link all songs in the library to Spotify tracks by title + artist search.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='Show what would be linked without saving.')
        parser.add_argument('--relink', action='store_true',
                            help='Also re-match songs that already have a spotify_track_id.')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        token = _spotify_client_token()
        if not token:
            raise CommandError(
                'Could not get a Spotify token. Check SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.'
            )

        qs = Song.objects.all()
        if not options['relink']:
            qs = qs.filter(spotify_track_id__isnull=True) | qs.filter(spotify_track_id='')
        qs = qs.order_by('id')

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('Nothing to do — every song is already linked.'))
            return
        self.stdout.write(f'Linking {total} song(s)...\n')

        linked = exact = skipped = failed = 0
        for song in qs:
            query = f'track:{song.title} artist:{song.artist}'
            try:
                resp = requests.get(
                    SEARCH_URL,
                    params={'q': query, 'type': 'track', 'limit': SEARCH_LIMIT, 'market': 'US'},
                    headers={'Authorization': f'Bearer {token}'},
                    timeout=10,
                )
                # Token expired mid-run (>1h) — refresh once and retry.
                if resp.status_code == 401:
                    token = _spotify_client_token()
                    resp = requests.get(
                        SEARCH_URL,
                        params={'q': query, 'type': 'track', 'limit': SEARCH_LIMIT, 'market': 'US'},
                        headers={'Authorization': f'Bearer {token}'},
                        timeout=10,
                    )
                # Rate limited — wait as instructed and retry once.
                if resp.status_code == 429:
                    wait = int(resp.headers.get('Retry-After', 2))
                    self.stdout.write(f'  rate limited, waiting {wait}s...')
                    time.sleep(wait)
                    resp = requests.get(
                        SEARCH_URL,
                        params={'q': query, 'type': 'track', 'limit': SEARCH_LIMIT, 'market': 'US'},
                        headers={'Authorization': f'Bearer {token}'},
                        timeout=10,
                    )
                resp.raise_for_status()
                items = resp.json().get('tracks', {}).get('items', [])
            except requests.RequestException as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f'✗ {song} — request failed: {exc}'))
                continue

            track, is_exact = _pick_match(song, items)
            if not track:
                skipped += 1
                self.stdout.write(self.style.WARNING(f'– {song} — no results, skipped'))
                continue

            artists = ', '.join(a.get('name', '') for a in track.get('artists', []))
            marker = '=' if is_exact else '~'
            self.stdout.write(
                f'{marker} {song}  ->  {track["name"]} by {artists}  ({track["id"]})'
            )

            if not dry_run:
                song.spotify_track_id = track['id']
                if track.get('preview_url'):
                    song.preview_url = track['preview_url']
                if not song.album_cover:
                    images = track.get('album', {}).get('images') or []
                    if images:
                        song.album_cover = images[0].get('url', '')[:255]
                if not song.album and track.get('album', {}).get('name'):
                    song.album = track['album']['name'][:255]
                song.save()

            linked += 1
            if is_exact:
                exact += 1
            time.sleep(0.2)  # stay friendly to the rate limit

        verb = 'Would link' if dry_run else 'Linked'
        self.stdout.write(self.style.SUCCESS(
            f'\n{verb} {linked}/{total} ({exact} exact, {linked - exact} best-guess); '
            f'{skipped} no-match, {failed} failed.'
        ))
        if linked - exact:
            self.stdout.write(
                'Best-guess matches are marked with "~" — spot-check those in the app '
                'and re-link any wrong ones from the Songs page.'
            )
