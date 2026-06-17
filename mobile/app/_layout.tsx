import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/landing');
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
      <Stack.Screen name="post/new" options={{ headerShown: false }} />
      <Stack.Screen name="users/index" options={{ headerShown: false }} />
      <Stack.Screen name="users/[id]" options={{ headerShown: true, title: 'Profile', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: true, title: 'About', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </ToastProvider>
        </PlayerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
