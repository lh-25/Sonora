export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

const ACCESS_KEY = 'sonora_access';
const REFRESH_KEY = 'sonora_refresh';

// ─── Token helpers (localStorage) ─────────────────────────────────────────────

export function saveTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const resp = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!resp.ok) {
    clearTokens();
    return null;
  }
  const data = await resp.json();
  saveTokens(data.access, data.refresh ?? refresh);
  return data.access;
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  let token = getAccessToken();
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

// ─── Types ────────────────────────────────────────────────────────────────────

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

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string) {
  const data = await request<{ access: string; refresh: string; user: User }>(
    '/auth/login/',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  );
  saveTokens(data.access, data.refresh);
  return data;
}

export async function signup(username: string, email: string, password: string, bio?: string) {
  const data = await request<{ access: string; refresh: string; user: User }>(
    '/auth/signup/',
    { method: 'POST', body: JSON.stringify({ username, email, password, bio }) },
  );
  saveTokens(data.access, data.refresh);
  return data;
}

export async function getMe(): Promise<{ user: User; profile: Profile }> {
  return request('/auth/me/');
}

// ─── Songs ────────────────────────────────────────────────────────────────────

export async function getSongs(params?: { genre?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.genre) qs.set('genre', params.genre);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  return request<PaginatedResponse<Song>>(`/songs/?${qs}`);
}

export async function getSong(id: number) {
  return request<Song>(`/songs/${id}/`);
}

export async function linkSpotifyTrack(songId: number, spotifyTrackId: string, previewUrl?: string) {
  return request<Song>(`/songs/${songId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ spotify_track_id: spotifyTrackId, preview_url: previewUrl }),
  });
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export async function getPlaylists(filter: 'public' | 'mine' = 'public', page = 1) {
  return request<PaginatedResponse<Playlist>>(`/playlists/?filter=${filter}&page=${page}`);
}

export async function getPlaylist(id: number) {
  return request<Playlist>(`/playlists/${id}/`);
}

export async function createPlaylist(data: { name: string; description?: string; visibility?: string }) {
  return request<Playlist>('/playlists/', { method: 'POST', body: JSON.stringify(data) });
}

export async function deletePlaylist(id: number) {
  return request<void>(`/playlists/${id}/`, { method: 'DELETE' });
}

export async function addSongToPlaylist(playlistId: number, songId: number) {
  return request<void>(`/playlists/${playlistId}/songs/`, {
    method: 'POST',
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function removeSongFromPlaylist(playlistId: number, songId: number) {
  return request<void>(`/playlists/${playlistId}/songs/${songId}/`, { method: 'DELETE' });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(filter: 'all' | 'mine' = 'all', page = 1) {
  return request<PaginatedResponse<Post>>(`/posts/?filter=${filter}&page=${page}`);
}

export async function getPost(id: number) {
  return request<Post>(`/posts/${id}/`);
}

export async function createPost(data: {
  song_id: number;
  post_title: string;
  reason_for_pick: string;
  standout_lyric: string;
}) {
  return request<Post>('/posts/', { method: 'POST', body: JSON.stringify(data) });
}

export async function likePost(id: number) {
  return request<{ liked: boolean; total_likes: number }>(`/posts/${id}/like/`, { method: 'POST' });
}

export async function addComment(postId: number, content: string, parentId?: number) {
  return request<Comment>(`/posts/${postId}/comments/`, {
    method: 'POST',
    body: JSON.stringify({ content, parent_id: parentId }),
  });
}

export async function likeComment(id: number) {
  return request<{ liked: boolean; total_likes: number }>(`/comments/${id}/like/`, { method: 'POST' });
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfiles(page = 1) {
  return request<PaginatedResponse<Profile>>(`/profiles/?page=${page}`);
}

export async function getProfile(userId: number) {
  return request<Profile>(`/profiles/${userId}/`);
}

export async function followUnfollow(userId: number) {
  return request<{ following: boolean; total_followers: number }>(
    `/profiles/${userId}/follow/`,
    { method: 'POST' },
  );
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

export async function spotifySearch(q: string, type = 'track', limit = 20) {
  const qs = new URLSearchParams({ q, type, limit: String(limit) });
  return request<any>(`/spotify/search/?${qs}`);
}

export async function spotifyStatus() {
  return request<{ connected: boolean; scope?: string }>('/spotify/status/');
}

export async function spotifyExchangeToken(code: string, redirectUri: string) {
  return request<any>('/spotify/exchange/', {
    method: 'POST',
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });
}

export async function spotifyDisconnect() {
  return request<any>('/spotify/disconnect/', { method: 'DELETE' });
}

export async function getSpotifyPlaylists() {
  return request<any>('/spotify/playlists/');
}

export async function importSpotifyPlaylist(spotifyPlaylistId: string, name?: string) {
  return request<{ playlist_id: number; name: string; imported_tracks: number }>(
    '/spotify/import/',
    { method: 'POST', body: JSON.stringify({ spotify_playlist_id: spotifyPlaylistId, name }) },
  );
}
