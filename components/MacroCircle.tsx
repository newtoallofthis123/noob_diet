import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroCircleProps {
  calories: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const MacroCircle: React.FC<MacroCircleProps> = ({ calories, target, protein, carbs, fat }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(calories / target, 0), 1);
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - animatedProgress.value),
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2}>
        <G rotation="-90" origin={`${radius + strokeWidth}, ${radius + strokeWidth}`}>
          {/* Background Circle */}
          <Circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={theme.macroCircleBg}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle - Main Calories */}
          <AnimatedCircle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={theme.tint}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.calories, { color: theme.text }]}>{calories}</Text>
        <Text style={[styles.target, { color: theme.subtext }]}>/ {target} kcal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  calories: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  target: {
    fontSize: 16,
    opacity: 0.8,
  },
});
