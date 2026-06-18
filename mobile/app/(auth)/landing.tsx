import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import GlassView from '@/components/GlassView';

const { height } = Dimensions.get('window');

const FEATURES = [
  { icon: '🎶', title: 'Endless Playlists', desc: 'Create playlists tailored to your mood and taste.' },
  { icon: '👍', title: 'Community Favorites', desc: 'Explore trending songs shared by the community.' },
  { icon: '🔥', title: 'Song of the Day', desc: 'Daily picks curated by music enthusiasts.' },
];

export default function LandingScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(cardAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Hero section */}
      <Animated.View
        style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>♪</Text>
          <Text style={styles.logoText}>Sonora</Text>
        </View>
        <Text style={styles.tagline}>The Music App of the Future</Text>
        <Text style={styles.desc}>
          Share your Song of the Day, follow friends, and build the ultimate playlist collection.
        </Text>
      </Animated.View>

      {/* Feature cards */}
      <Animated.View style={[styles.features, { opacity: cardAnim }]}>
        {FEATURES.map((f, i) => (
          <Animated.View
            key={f.title}
            style={{
              opacity: cardAnim,
              transform: [{
                translateX: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [i % 2 === 0 ? -30 : 30, 0],
                }),
              }],
            }}
          >
            <GlassView style={styles.featureCard} borderRadius={14} intensity={55}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </GlassView>
          </Animated.View>
        ))}
      </Animated.View>

      {/* CTA buttons */}
      <Animated.View style={[styles.actions, { opacity: cardAnim }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#ff4040', '#ff7b40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aboutLink}
          onPress={() => router.push('/about')}
        >
          <Text style={styles.aboutLinkText}>About Sonora</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 212, 255, 0.14)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 64, 255, 0.11)',
  },
  hero: {
    alignItems: 'flex-start',
    gap: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logoIcon: {
    fontSize: 36,
    color: Colors.primary,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  desc: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    maxWidth: 300,
  },
  features: {
    gap: 10,
    marginVertical: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  featureIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  featureTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 25,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  aboutLink: {
    paddingVertical: 8,
  },
  aboutLinkText: {
    color: Colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
