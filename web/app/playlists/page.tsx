'use client';

import { useEffect, useState } from 'react';
import {
  Button, Text, H1, H2, H3, StackLayout, FlexLayout, Spinner,
  Dialog, DialogHeader, DialogContent, DialogActions,
  FormField, FormFieldLabel, Input, MultilineInput, RadioButton, RadioButtonGroup,
  ToggleButton, ToggleButtonGroup,
} from '@salt-ds/core';
import {
  getPlaylists, createPlaylist, getSpotifyPlaylists, importSpotifyPlaylist,
  spotifyStatus, type Playlist,
} from '@/services/api';
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
  const [creating, setCreating] = useState(false);

  // Spotify import
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [spotifyPls, setSpotifyPls] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getPlaylists(filter).then((d) => setPlaylists(d.results)),
      spotifyStatus().then((s) => setSpotifyConnected(s.connected)),
    ]).finally(() => setLoading(false));
  }, [filter]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createPlaylist({ name: newName, description: newDesc, visibility: newVisibility });
      setCreateOpen(false);
      setNewName(''); setNewDesc('');
      const d = await getPlaylists(filter);
      setPlaylists(d.results);
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
      alert('Could not fetch Spotify playlists. Make sure Spotify is connected in your profile.');
    }
  };

  const handleImport = async (id: string, name: string) => {
    setImporting(id);
    try {
      const r = await importSpotifyPlaylist(id, name);
      alert(`Imported "${r.name}" with ${r.imported_tracks} tracks!`);
      const d = await getPlaylists('mine');
      setPlaylists(d.results);
      setFilter('mine');
      setImportOpen(false);
    } catch {
      alert('Import failed.');
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
          onChange={(val) => setFilter(val as 'public' | 'mine')}
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
                  <Text styleAs="help" className={styles.plMeta}>
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader header="New Playlist" />
        <DialogContent>
          <StackLayout gap={2}>
            <FormField>
              <FormFieldLabel>Name *</FormFieldLabel>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Playlist name" />
            </FormField>
            <FormField>
              <FormFieldLabel>Description</FormFieldLabel>
              <MultilineInput value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} />
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
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} loading={creating}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogHeader header="Import from Spotify" />
        <DialogContent>
          <StackLayout gap={1} className={styles.importList}>
            {spotifyPls.length === 0 && (
              <Text styleAs="help">No Spotify playlists found.</Text>
            )}
            {spotifyPls.map((pl: any) => (
              <FlexLayout key={pl.id} justify="space-between" align="center" className={styles.importRow}>
                <div>
                  <Text styleAs="label" className={styles.importName}>{pl.name}</Text>
                  <Text styleAs="help" className={styles.importMeta}>{pl.tracks?.total} tracks</Text>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleImport(pl.id, pl.name)}
                  loading={importing === pl.id}
                >
                  Import
                </Button>
              </FlexLayout>
            ))}
          </StackLayout>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setImportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
