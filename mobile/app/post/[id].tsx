import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { getPost, likePost, addComment, likeComment, type Post, type Comment } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { play } = usePlayer();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPost(Number(id))
      .then((p) => {
        setPost(p);
        navigation.setOptions({ title: p.post_title });
      })
      .catch(() => Alert.alert('Error', 'Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const r = await likePost(post.id);
      setPost((p) => p ? { ...p, is_liked: r.liked, total_likes: r.total_likes } : p);
    } catch {}
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !post) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(post.id, comment.trim(), replyTo?.id);
      setPost((p) => {
        if (!p) return p;
        if (replyTo) {
          const updated = (p.comments ?? []).map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...c.replies, newComment] } : c,
          );
          return { ...p, comments: updated };
        }
        return { ...p, comments: [...(p.comments ?? []), newComment], comment_count: p.comment_count + 1 };
      });
      setComment('');
      setReplyTo(null);
    } catch {
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />;
  if (!post) return null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Post image */}
        {post.post_image && (
          <Image source={{ uri: post.post_image }} style={styles.postImage} />
        )}

        {/* Song row */}
        <TouchableOpacity style={styles.songRow} onPress={() => play(post.song)}>
          {post.song.album_cover && (
            <Image source={{ uri: post.song.album_cover }} style={styles.albumArt} />
          )}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{post.song.title}</Text>
            <Text style={styles.songArtist}>{post.song.artist}</Text>
          </View>
          <Ionicons name="play-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>

        {/* Post content */}
        <Text style={styles.postTitle}>{post.post_title}</Text>

        <View style={styles.infoBlock}>
          <Text style={styles.blockLabel}>Why this song?</Text>
          <Text style={styles.blockText}>{post.reason_for_pick}</Text>
        </View>

        {post.standout_lyric && (
          <View style={styles.lyricBlock}>
            <Text style={styles.lyricText}>"{post.standout_lyric}"</Text>
          </View>
        )}

        {/* Like row */}
        <View style={styles.likeRow}>
          <Text style={styles.postedBy}>by {post.user.username}</Text>
          <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.is_liked ? Colors.like : Colors.textMuted}
            />
            <Text style={styles.likeCount}>{post.total_likes}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({post.comment_count})</Text>
          {(post.comments ?? []).map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={user?.id}
              onReply={(id, username) => setReplyTo({ id, username })}
              onLike={async (id) => {
                const r = await likeComment(id);
                setPost((p) => {
                  if (!p) return p;
                  const updateLike = (comments: Comment[]): Comment[] =>
                    comments.map((c) =>
                      c.id === id
                        ? { ...c, is_liked: r.liked, total_likes: r.total_likes }
                        : { ...c, replies: updateLike(c.replies) },
                    );
                  return { ...p, comments: updateLike(p.comments ?? []) };
                });
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Comment input */}
      <View style={styles.commentInput}>
        {replyTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyText}>Replying to @{replyTo.username}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder={replyTo ? `Reply to @${replyTo.username}…` : 'Add a comment…'}
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity onPress={handleSubmitComment} disabled={submitting || !comment.trim()}>
            {submitting ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons
                name="send"
                size={22}
                color={comment.trim() ? Colors.primary : Colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentItem({
  comment, depth = 0, onReply, onLike, currentUserId,
}: {
  comment: Comment;
  depth?: number;
  onReply: (id: number, username: string) => void;
  onLike: (id: number) => void;
  currentUserId?: number;
}) {
  return (
    <View style={[styles.comment, depth > 0 && styles.commentIndented]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentUser}>@{comment.user.username}</Text>
        <TouchableOpacity style={styles.commentLike} onPress={() => onLike(comment.id)}>
          <Ionicons
            name={comment.is_liked ? 'heart' : 'heart-outline'}
            size={14}
            color={comment.is_liked ? Colors.like : Colors.textMuted}
          />
          <Text style={styles.commentLikeCount}>{comment.total_likes}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <TouchableOpacity onPress={() => onReply(comment.id, comment.user.username)}>
        <Text style={styles.replyLink}>Reply</Text>
      </TouchableOpacity>
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          onLike={onLike}
          currentUserId={currentUserId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  songRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  albumArt: { width: 48, height: 48, borderRadius: 8 },
  songInfo: { flex: 1 },
  songTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  songArtist: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  postTitle: { color: Colors.text, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  infoBlock: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 12 },
  blockLabel: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  blockText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  lyricBlock: {
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    paddingLeft: 14, marginBottom: 16,
  },
  lyricText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 15, lineHeight: 22 },
  likeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 8,
  },
  postedBy: { color: Colors.textMuted, fontSize: 13 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { color: Colors.textMuted, fontSize: 14 },
  commentsSection: { gap: 2 },
  commentsTitle: {
    color: Colors.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  comment: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  commentIndented: { marginLeft: 20, borderLeftWidth: 2, borderLeftColor: Colors.border, paddingLeft: 12 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  commentContent: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  commentLike: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentLikeCount: { color: Colors.textMuted, fontSize: 12 },
  replyLink: { color: Colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  commentInput: {
    backgroundColor: Colors.surface, borderTopWidth: 1,
    borderTopColor: Colors.border, paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  replyBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  replyText: { color: Colors.textMuted, fontSize: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 8,
  },
  input: {
    flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, color: Colors.text,
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: Colors.border,
  },
});
