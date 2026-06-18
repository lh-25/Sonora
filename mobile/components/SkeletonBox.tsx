import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  width?: ViewStyle['width'];
  height: number;
  radius?: number;
  style?: ViewStyle;
}

export default function SkeletonBox({ width = '100%', height, radius = 6, style }: Props) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ backgroundColor: Colors.surfaceAlt, width, height, borderRadius: radius, opacity }, style]}
    />
  );
}
