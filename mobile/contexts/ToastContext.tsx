import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import {
  Animated, StyleSheet, Text, TouchableOpacity, View, AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GlassView from '@/components/GlassView';
import { Colors } from '@/constants/colors';

type Variant = 'success' | 'error' | 'info';

type Toast = { id: number; message: string; variant: Variant };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const VARIANTS: Record<Variant, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: Colors.green },
  error: { icon: 'alert-circle', color: Colors.error },
  info: { icon: 'information-circle', color: Colors.primary },
};

const DURATION = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [anim]);

  const show = useCallback((message: string, variant: Variant) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    nextId.current += 1;
    setToast({ id: nextId.current, message, variant });
    AccessibilityInfo.announceForAccessibility?.(message);
  }, []);

  // Animate in whenever a new toast is set, then schedule auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
    hideTimer.current = setTimeout(dismiss, DURATION);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [toast, anim, dismiss]);

  const api = useRef<ToastApi>({
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  }).current;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0],
  });

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <View
          pointerEvents="box-none"
          style={[styles.overlay, { top: insets.top + 8 }]}
        >
          <Animated.View style={{ opacity: anim, transform: [{ translateY }], width: '100%' }}>
            <GlassView style={styles.glass} borderRadius={16} intensity={70}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={dismiss}
                accessibilityRole="alert"
                accessibilityLabel={toast.message}
                style={styles.row}
              >
                <Ionicons
                  name={VARIANTS[toast.variant].icon}
                  size={22}
                  color={VARIANTS[toast.variant].color}
                />
                <Text style={styles.message} numberOfLines={3}>
                  {toast.message}
                </Text>
              </TouchableOpacity>
              <View
                style={[styles.accent, { backgroundColor: VARIANTS[toast.variant].color }]}
              />
            </GlassView>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  glass: {
    width: '100%',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  message: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});
