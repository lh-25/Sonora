import * as SecureStore from 'expo-secure-store';

// Change this to your Django server URL for development
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

const ACCESS_KEY = 'sonora_access_token';
const REFRESH_KEY = 'sonora_refresh_token';

// ─── Token storage ────────────────────────────────────────────────────────────

export async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  const resp = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!resp.ok) {
    await clearTokens();
    return null;
  }
  const data = await resp.json();
  await saveTokens(data.access, data.refresh ?? refresh);
  return data.access;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  let token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (resp.status === 401 && retry) {
    token = await refreshAccessToken();
    if (token) return request<T>(path, options, false);
    throw new Error('UNAUTHORIZED');
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(body || `HTTP ${resp.status}`);
  }

  if (resp.status === 204) return undefined as T;
  return resp.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type TokenPair = { access: string; refresh: string };
// Only signup returns the user inline; login is SimpleJWT's stock view
// and returns just the token pair.
export type AuthTokens = TokenPair & { user: User };

export async function signup(username: string, email: string, password: string, bio?: string): Promise<AuthTokens> {
  const data = await request<AuthTokens>('/auth/signup/', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, bio }),
  });
  await saveTokens(data.access, data.refresh);
  return data;
}

export async function login(username: string, password: string): Promise<TokenPair> {
  const data = await request<TokenPair>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  await saveTokens(data.access, data.refresh);
  return data;
}

export async function getMe(): Promise<{ user: User; profile: Profile }> {
  return request('/auth/me/');
}

// ─── Songs ────────────────────────────────────────────────────────────────────

export type Song = {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  genre: string;
  release_date: string | null;
  duration: string;
  formatted_duration: string;
  album_cover: string | null;
  spotify_track_id: string | null;
  preview_url: string | null;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function getSongs(params?: { genre?: string; search?: string; page?: number }): Promise<PaginatedResponse<Song>> {
  const qs = new URLSearchParams();
  if (params?.genre) qs.set('genre', params.genre);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  return request(`/songs/?${qs}`);
}

export async function getSong(id: number): Promise<Song> {
  return request(`/songs/${id}/`);
}

export async function linkSpotifyTrack(songId: number, spotifyTrackId: string, previewUrl?: string): Promise<Song> {
  return request(`/songs/${songId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ spotify_track_id: spotifyTrackId, preview_url: previewUrl }),
  });
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export type Playlist = {
  id: number;
  user: User;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  date_created: string;
  playlist_cover: string | null;
  songs: Song[];
  song_count: number;
};

export async function getPlaylists(filter: 'public' | 'mine' = 'public', page = 1): Promise<PaginatedResponse<Playlist>> {
  return request(`/playlists/?filter=${filter}&page=${page}`);
}

export async function getPlaylist(id: number): Promise<Playlist> {
  return request(`/playlists/${id}/`);
}

export async function createPlaylist(data: { name: string; description?: string; visibility?: string }): Promise<Playlist> {
  return request('/playlists/', { method: 'POST', body: JSON.stringify(data) });
}

export async function deletePlaylist(id: number): Promise<void> {
  return request(`/playlists/${id}/`, { method: 'DELETE' });
}

export async function addSongToPlaylist(playlistId: number, songId: number): Promise<void> {
  return request(`/playlists/${playlistId}/songs/`, {
    method: 'POST',
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function removeSongFromPlaylist(playlistId: number, songId: number): Promise<void> {
  return request(`/playlists/${playlistId}/songs/${songId}/`, { method: 'DELETE' });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export type Post = {
  id: number;
  user: User;
  song: Song;
  post_title: string;
  reason_for_pick: string;
  standout_lyric: string;
  date_posted: string;
  post_image: string | null;
  total_likes: number;
  is_liked: boolean;
  comment_count: number;
  comments?: Comment[];
};

export type Comment = {
  id: number;
  user: User;
  content: string;
  date_posted: string;
  parent: number | null;
  total_likes: number;
  is_liked: boolean;
  replies: Comment[];
};

export async function getPosts(filter: 'all' | 'mine' = 'all', page = 1): Promise<PaginatedResponse<Post>> {
  return request(`/posts/?filter=${filter}&page=${page}`);
}

export async function getPost(id: number): Promise<Post> {
  return request(`/posts/${id}/`);
}

export async function createPost(data: {
  song_id: number;
  post_title: string;
  reason_for_pick: string;
  standout_lyric: string;
}): Promise<Post> {
  return request('/posts/', { method: 'POST', body: JSON.stringify(data) });
}

export async function likePost(id: number): Promise<{ liked: boolean; total_likes: number }> {
  return request(`/posts/${id}/like/`, { method: 'POST' });
}

export async function addComment(postId: number, content: string, parentId?: number): Promise<Comment> {
  return request(`/posts/${postId}/comments/`, {
    method: 'POST',
    body: JSON.stringify({ content, parent_id: parentId }),
  });
}

export async function likeComment(id: number): Promise<{ liked: boolean; total_likes: number }> {
  return request(`/comments/${id}/like/`, { method: 'POST' });
}

export async function editComment(id: number, content: string): Promise<Comment> {
  return request(`/comments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(id: number): Promise<void> {
  return request(`/comments/${id}/`, { method: 'DELETE' });
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export type User = { id: number; username: string; email: string };

export type Profile = {
  id: number;
  user: User;
  profile_picture: string | null;
  bio: string | null;
  total_followers: number;
  total_following: number;
  is_following?: boolean;
};

export async function getProfiles(page = 1): Promise<PaginatedResponse<Profile>> {
  return request(`/profiles/?page=${page}`);
}

export async function getProfile(userId: number): Promise<Profile> {
  return request(`/profiles/${userId}/`);
}

export async function followUnfollow(userId: number): Promise<{ following: boolean; total_followers: number }> {
  return request(`/profiles/${userId}/follow/`, { method: 'POST' });
}

export async function getFollowers(userId: number, page = 1): Promise<PaginatedResponse<Profile>> {
  return request(`/profiles/${userId}/followers/?page=${page}`);
}

export async function getFollowing(userId: number, page = 1): Promise<PaginatedResponse<Profile>> {
  return request(`/profiles/${userId}/following/?page=${page}`);
}

export async function getUserPosts(userId: number, page = 1): Promise<PaginatedResponse<Post>> {
  return request(`/posts/?filter=user&user_id=${userId}&page=${page}`);
}

export async function updateProfileMultipart(formData: FormData): Promise<{ user: User; profile: Profile }> {
  let token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(`${API_BASE}/auth/me/`, {
    method: 'PATCH',
    headers,
    body: formData,
  });
  if (resp.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      const headers2: Record<string, string> = { Authorization: `Bearer ${token}` };
      const resp2 = await fetch(`${API_BASE}/auth/me/`, { method: 'PATCH', headers: headers2, body: formData });
      if (!resp2.ok) throw new Error(await resp2.text());
      return resp2.json();
    }
    throw new Error('UNAUTHORIZED');
  }
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export async function createPostMultipart(formData: FormData): Promise<Post> {
  let token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(`${API_BASE}/posts/`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (resp.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      const headers2: Record<string, string> = { Authorization: `Bearer ${token}` };
      const resp2 = await fetch(`${API_BASE}/posts/`, { method: 'POST', headers: headers2, body: formData });
      if (!resp2.ok) throw new Error(await resp2.text());
      return resp2.json();
    }
    throw new Error('UNAUTHORIZED');
  }
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

export async function spotifySearch(q: string, type = 'track', limit = 10) {
  const qs = new URLSearchParams({ q, type, limit: String(limit) });
  return request<any>(`/spotify/search/?${qs}`);
}

export async function spotifyStatus(): Promise<{ connected: boolean; scope?: string }> {
  return request('/spotify/status/');
}

export async function spotifyExchangeToken(code: string, redirectUri: string) {
  return request('/spotify/exchange/', {
    method: 'POST',
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });
}

export async function spotifyDisconnect() {
  return request('/spotify/disconnect/', { method: 'DELETE' });
}

export async function getSpotifyPlaylists() {
  return request<any>('/spotify/playlists/');
}

export async function importSpotifyPlaylist(spotifyPlaylistId: string, name?: string) {
  return request<{ playlist_id: number; name: string; imported_tracks: number }>(
    '/spotify/import/',
    {
      method: 'POST',
      body: JSON.stringify({ spotify_playlist_id: spotifyPlaylistId, name }),
    },
  );
}

export async function updateProfile(userId: number, data: { bio?: string; profile_picture?: string }) {
  return request<any>(`/profiles/${userId}/`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function createSong(data: {
  title: string; artist: string; album?: string; genre: string; album_cover?: string;
}) {
  return request<any>('/songs/', { method: 'POST', body: JSON.stringify(data) });
}

export async function uploadImage(uri: string, folder = 'uploads', mimeType = 'image/jpeg'): Promise<{ url: string }> {
  const token = await getAccessToken();
  const form = new FormData();
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  (form as any).append('image', { uri, name: filename, type: mimeType });
  (form as any).append('folder', folder);
  const resp = await fetch(`${API_BASE}/upload/image/`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'multipart/form-data',
    },
    body: form,
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}
