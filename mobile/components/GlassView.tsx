import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
};

/**
 * Liquid Glass container — stacks a blur backdrop, dark tint, specular
 * highlight, and hairline border to produce Apple's iOS 26 glass effect.
 * Children render on top of all glass layers.
 */
export default function GlassView({
  children,
  style,
  intensity = 65,
  borderRadius = 16,
}: Props) {
  return (
    <View style={[styles.wrapper, { borderRadius }, style]}>
      {/* 1. Frosted blur backdrop */}
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />

      {/* 2. Dark tint — adds depth and the faint brand-cyan cast */}
      <View style={[StyleSheet.absoluteFill, styles.tint]} />

      {/* 3. Specular highlight — white gradient at the top edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.00)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 4. Hairline border */}
      <View style={[StyleSheet.absoluteFill, styles.border]} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  tint: {
    backgroundColor: 'rgba(8, 10, 20, 0.52)',
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
});
