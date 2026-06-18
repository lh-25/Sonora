import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import MusicPlayer from '@/components/MusicPlayer';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

function GlassTabBar() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.00)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, tabStyles.topBorder]} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  topBorder: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
});

export default function TabsLayout() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarBackground: () => <GlassTabBar />,
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            height: 64,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, marginTop: -2 },
        }}
      >
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="songs"
          options={{
            title: 'Songs',
            tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: 'Playlists',
            tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'People',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
            headerShown: false,
          }}
        />
      </Tabs>
      <MusicPlayer />
    </View>
  );
}
