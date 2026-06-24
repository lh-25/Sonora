/**
 * Client-side Spotify helpers used by the mobile app.
 * Auth is handled via PKCE so we never expose the client secret on-device.
 * All heavy lifting (import, token storage) goes through our Django backend.
 */
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

const TOKEN_KEY = 'spotify_access_token';
const REFRESH_KEY = 'spotify_refresh_token';

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

async function generateCodeVerifier(length = 64): Promise<string> {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(randomBytes)
    .map((b) => charset[b % charset.length])
    .join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function useSpotifyAuth() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'sonora', path: 'spotify-callback' });

  const authorize = async (): Promise<{ code: string; redirectUri: string; codeVerifier: string } | null> => {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    const authUrl =
      `https://accounts.spotify.com/authorize?` +
      new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope: SCOPES,
      }).toString();

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success') return null;

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (!code) return null;
    return { code, redirectUri, codeVerifier: verifier };
  };

  return { authorize, redirectUri };
}

// ─── Token storage (client-side, separate from server tokens) ─────────────────

export async function saveSpotifyClientTokens(access: string, refresh: string, expiresIn: number) {
  const expiresAt = Date.now() + expiresIn * 1000;
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify({ token: access, expiresAt }));
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function getSpotifyClientToken(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  const { token, expiresAt } = JSON.parse(raw);
  if (Date.now() >= expiresAt - 60_000) return null; // expired or expiring soon
  return token;
}

// ─── Track helpers ────────────────────────────────────────────────────────────

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
    release_date: string;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
};

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function spotifyTrackToSongPayload(track: SpotifyTrack) {
  return {
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    genre: 'OTHER' as const,
    release_date: track.album.release_date || null,
    duration: formatDurationIso(track.duration_ms),
    album_cover: track.album.images[0]?.url ?? null,
    spotify_track_id: track.id,
    preview_url: track.preview_url,
  };
}

function formatDurationIso(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function openInSpotify(trackId: string) {
  const { Linking } = require('react-native');
  Linking.openURL(`spotify:track:${trackId}`).catch(() => {
    Linking.openURL(`https://open.spotify.com/track/${trackId}`);
  });
}
