import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Post } from '@/services/api';

type Props = {
  post: Post;
  onPress?: (post: Post) => void;
  onLike?: (post: Post) => void;
  onPlaySong?: (post: Post) => void;
};

export default function PostCard({ post, onPress, onLike, onPlaySong }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(post)} activeOpacity={0.85}>
      {post.post_image && (
        <Image source={{ uri: post.post_image }} style={styles.image} />
      )}

      <View style={styles.body}>
        {/* Song info row */}
        <TouchableOpacity style={styles.songRow} onPress={() => onPlaySong?.(post)}>
          {post.song.album_cover ? (
            <Image source={{ uri: post.song.album_cover }} style={styles.albumArt} />
          ) : (
            <View style={[styles.albumArt, styles.artPlaceholder]}>
              <Ionicons name="musical-note" size={16} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>{post.song.title}</Text>
            <Text style={styles.songArtist} numberOfLines={1}>{post.song.artist}</Text>
          </View>
          {(post.song.preview_url || post.song.spotify_track_id) && (
            <Ionicons name="play-circle-outline" size={22} color={Colors.primary} />
          )}
        </TouchableOpacity>

        {/* Post content */}
        <Text style={styles.postTitle}>{post.post_title}</Text>

        {post.standout_lyric ? (
          <View style={styles.lyricContainer}>
            <Text style={styles.lyricQuote}>"{post.standout_lyric}"</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.userRow}>
            <Ionicons name="person-circle-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.username}>{post.user.username}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => onLike?.(post)}>
              <Ionicons
                name={post.is_liked ? 'heart' : 'heart-outline'}
                size={18}
                color={post.is_liked ? Colors.like : Colors.textMuted}
              />
              <Text style={styles.actionText}>{post.total_likes}</Text>
            </TouchableOpacity>

            <View style={styles.action}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.actionText}>{post.comment_count}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 180,
  },
  body: {
    padding: 14,
    gap: 10,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceAlt,
    padding: 8,
    borderRadius: 8,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  artPlaceholder: {
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  songArtist: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  postTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  lyricContainer: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.magenta,
    paddingLeft: 10,
  },
  lyricQuote: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
