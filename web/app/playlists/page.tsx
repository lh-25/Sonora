'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Button, Text, H1, H3, StackLayout, FlexLayout, Spinner,
  Dialog, DialogHeader, DialogContent, DialogActions,
  FormField, FormFieldLabel, Input, MultilineInput, RadioButton, RadioButtonGroup,
  ToggleButton, ToggleButtonGroup,
} from '@salt-ds/core';
import {
  getPlaylists, createPlaylist, getSpotifyPlaylists, importSpotifyPlaylist,
  spotifyStatus, uploadImage, type Playlist,
} from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import styles from './playlists.module.css';
import Link from 'next/link';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'public' | 'mine'>('public');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVisibility, setNewVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [creating, setCreating] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  // Spotify import
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [spotifyPls, setSpotifyPls] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getPlaylists(filter).then((d) => setPlaylists(d.results)),
      spotifyStatus().then((s) => setSpotifyConnected(s.connected)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [filter]);

  const resetCreateForm = () => {
    setNewName(''); setNewDesc(''); setNewVisibility('PRIVATE'); setCoverUrl('');
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { url } = await uploadImage(file, 'playlist_covers');
      setCoverUrl(url);
    } catch {
      toast.error('Could not upload cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createPlaylist({
        name: newName.trim(),
        description: newDesc.trim(),
        visibility: newVisibility,
        playlist_cover: coverUrl || undefined,
      });
      setCreateOpen(false);
      resetCreateForm();
      const d = await getPlaylists(filter);
      setPlaylists(d.results);
      toast.success(`Playlist "${newName.trim()}" created`);
    } catch {
      toast.error('Could not create playlist — please try again.');
    } finally {
      setCreating(false);
    }
  };

  const openImport = async () => {
    try {
      const data = await getSpotifyPlaylists();
      setSpotifyPls(data?.items ?? []);
      setImportOpen(true);
    } catch {
      toast.error('Could not load Spotify playlists. Make sure Spotify is connected in your profile.');
    }
  };

  const handleImport = async (id: string, name: string) => {
    setImporting(id);
    try {
      const r = await importSpotifyPlaylist(id, name);
      toast.success(`Imported "${r.name}" with ${r.imported_tracks} tracks`);
      const d = await getPlaylists('mine');
      setPlaylists(d.results);
      setFilter('mine');
      setImportOpen(false);
    } catch {
      toast.error('Import failed — please try again.');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className="page-container">
        <FlexLayout justify="space-between" align="center" className={styles.header}>
          <H1 className={styles.title}>Playlists</H1>
          <FlexLayout gap={1} align="center">
            {spotifyConnected && (
              <Button variant="secondary" onClick={openImport}>
                ↓ Import from Spotify
              </Button>
            )}
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              + New Playlist
            </Button>
          </FlexLayout>
        </FlexLayout>

        <ToggleButtonGroup
          value={filter}
          onChange={(e: React.SyntheticEvent<HTMLButtonElement>) => setFilter(e.currentTarget.value as 'public' | 'mine')}
          className={styles.filterGroup}
        >
          <ToggleButton value="public">Public</ToggleButton>
          <ToggleButton value="mine">Mine</ToggleButton>
        </ToggleButtonGroup>

        {loading ? (
          <FlexLayout justify="center" className={styles.spinner}>
            <Spinner size="large" />
          </FlexLayout>
        ) : playlists.length === 0 ? (
          <StackLayout align="center" className={styles.empty}>
            <H3>No playlists yet</H3>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Create your first playlist
            </Button>
          </StackLayout>
        ) : (
          <div className={styles.grid}>
            {playlists.map((pl) => (
              <Link key={pl.id} href={`/playlists/${pl.id}`} className={styles.plCard}>
                {pl.playlist_cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pl.playlist_cover} alt={pl.name} className={styles.plCover} />
                ) : (
                  <div className={styles.plCoverPlaceholder}>♬</div>
                )}
                <div className={styles.plInfo}>
                  <Text styleAs="label" className={styles.plName}>{pl.name}</Text>
                  <Text styleAs="notation" className={styles.plMeta}>
                    {pl.song_count} songs · {pl.user.username}
                  </Text>
                  <span className="sonora-tag" style={{ marginTop: 4, display: 'inline-flex' }}>
                    {pl.visibility}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreateForm(); }}>
        <DialogHeader header="New Playlist" />
        <DialogContent>
          <StackLayout gap={3}>
            {/* Cover */}
            <div className={styles.coverField}>
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="cover" className={styles.coverPreview} />
              ) : (
                <div className={styles.coverPlaceholder}>♬</div>
              )}
              <div>
                <Button variant="secondary" onClick={() => coverRef.current?.click()} loading={uploadingCover}>
                  {coverUrl ? 'Change Cover' : 'Upload Cover'}
                </Button>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleCoverUpload}
                />
                <Text styleAs="notation" className={styles.coverHint}>Optional · JPG or PNG</Text>
              </div>
            </div>

            <FormField>
              <FormFieldLabel>Name *</FormFieldLabel>
              <Input value={newName} onChange={(e) => setNewName((e.target as HTMLInputElement).value)} placeholder="Playlist name" />
            </FormField>
            <FormField>
              <FormFieldLabel>Description</FormFieldLabel>
              <MultilineInput value={newDesc} onChange={(e) => setNewDesc((e.target as HTMLTextAreaElement).value)} rows={3} placeholder="What's this playlist about?" />
            </FormField>
            <FormField>
              <FormFieldLabel>Visibility</FormFieldLabel>
              <RadioButtonGroup
                direction="horizontal"
                value={newVisibility}
                onChange={(e) => setNewVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
              >
                <RadioButton key="public" label="Public" value="PUBLIC" />
                <RadioButton key="private" label="Private" value="PRIVATE" />
              </RadioButtonGroup>
            </FormField>
          </StackLayout>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} loading={creating} disabled={!newName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogHeader header="Import from Spotify" />
        <DialogContent>
          <div className={styles.importList}>
            {spotifyPls.length === 0 && (
              <Text styleAs="notation" className={styles.importEmpty}>No Spotify playlists found.</Text>
            )}
            {spotifyPls.map((pl: any) => (
              <div key={pl.id} className={styles.importRow}>
                {pl.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pl.images[0].url} alt={pl.name} className={styles.importCover} />
                ) : (
                  <div className={styles.importCoverPlaceholder}>♬</div>
                )}
                <div className={styles.importInfo}>
                  <Text styleAs="label" className={styles.importName}>{pl.name}</Text>
                  <Text styleAs="notation" className={styles.importMeta}>{pl.tracks?.total ?? 0} tracks</Text>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleImport(pl.id, pl.name)}
                  loading={importing === pl.id}
                >
                  Import
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setImportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
