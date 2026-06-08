import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { Colors } from '@/constants/colors';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)/feed');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="song/[id]" options={{ headerShown: true, title: 'Song', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text }} />
      <Stack.Screen name="playlist/[id]" options={{ headerShown: true, title: 'Playlist', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text }} />
      <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Post', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </PlayerProvider>
    </AuthProvider>
  );
}
