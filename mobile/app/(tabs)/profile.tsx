import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  spotifyStatus, spotifyDisconnect,
} from '@/services/api';
import { useSpotifyAuth } from '@/services/spotify';
import { spotifyExchangeToken } from '@/services/api';

export default function ProfileScreen() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const { authorize } = useSpotifyAuth();

  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loadingSpotify, setLoadingSpotify] = useState(false);

  useEffect(() => {
    spotifyStatus().then((s) => setSpotifyConnected(s.connected)).catch(() => {});
  }, []);

  const handleConnectSpotify = async () => {
    setLoadingSpotify(true);
    try {
      const result = await authorize();
      if (!result) { setLoadingSpotify(false); return; }
      await spotifyExchangeToken(result.code, result.redirectUri);
      setSpotifyConnected(true);
      Alert.alert('Connected!', 'Spotify is now linked to your account.');
    } catch {
      Alert.alert('Error', 'Could not connect Spotify. Check your credentials.');
    } finally {
      setLoadingSpotify(false);
    }
  };

  const handleDisconnectSpotify = () => {
    Alert.alert('Disconnect Spotify', 'Remove Spotify connection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await spotifyDisconnect();
          setSpotifyConnected(false);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user || !profile) {
    return <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {profile.profile_picture ? (
            <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color={Colors.textMuted} />
            </View>
          )}
          <Text style={styles.username}>{user.username}</Text>
          {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem label="Followers" value={profile.total_followers} />
          <View style={styles.statDivider} />
          <StatItem label="Following" value={profile.total_following} />
        </View>

        {/* Spotify connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spotify</Text>
          {spotifyConnected ? (
            <View style={styles.spotifyConnected}>
              <View style={styles.spotifyRow}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                <Text style={styles.spotifyStatus}>Connected to Spotify</Text>
              </View>
              <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnectSpotify}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.connectBtn, loadingSpotify && styles.connectBtnDisabled]}
              onPress={handleConnectSpotify}
              disabled={loadingSpotify}
            >
              {loadingSpotify ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="musical-note" size={18} color="#000" />
                  <Text style={styles.connectBtnText}>Connect Spotify</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.spotifyHint}>
            Connect Spotify to import playlists, link songs, and play 30-second previews.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingTop: 10 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  username: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  email: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  bio: { color: Colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'center',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: Colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  spotifyConnected: { gap: 12 },
  spotifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spotifyStatus: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  disconnectBtn: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  disconnectText: { color: Colors.textSecondary, fontSize: 13 },
  connectBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  connectBtnDisabled: { opacity: 0.6 },
  connectBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  spotifyHint: {
    color: Colors.textMuted, fontSize: 12, marginTop: 10, lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 4,
  },
  actionText: { fontSize: 16, fontWeight: '500' },
});
