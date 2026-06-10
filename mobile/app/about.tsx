import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* About Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>About Sonora</Text>
          <Text style={styles.heroDesc}>
            Sonora is a platform where music enthusiasts can share and discover
            playlists and songs of the day. We aim to bring people together through
            the universal language of music. Whether you're creating, sharing, or
            discovering playlists, Sonora is your hub for musical inspiration.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            At Sonora, we aim to bring people together through the universal language
            of music. Whether you're creating, sharing, or discovering playlists,
            Sonora is your hub for musical inspiration.
          </Text>
        </View>

        {/* Creator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet the Creator</Text>
          <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarIcon}>♪</Text>
            </View>
            <Text style={styles.creatorName}>Leah</Text>
            <Text style={styles.creatorBio}>
              Hi! I'm the sole developer and designer of Sonora. I created this
              platform to make sharing and discovering music easier and more enjoyable
              for everyone. Thank you for being a part of the Sonora community!
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2024 Sonora Music App</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingBottom: 48 },

  heroSection: {
    marginBottom: 28,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 16,
  },
  heroDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  creatorCard: {
    alignItems: 'center',
    paddingTop: 8,
  },
  creatorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  creatorAvatarIcon: {
    fontSize: 32,
    color: Colors.primary,
  },
  creatorName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.magenta,
    marginBottom: 12,
  },
  creatorBio: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },

  footer: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
});
