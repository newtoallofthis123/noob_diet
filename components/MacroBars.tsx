import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface MacroBarsProps {
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fat: number;
  targetFat: number;
}

const ProgressBar = ({ label, value, target, color, unit = 'g' }: { label: string, value: number, target: number, color: string, unit?: string }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const progress = Math.min(Math.max(value / target, 0), 1);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress * 100, { duration: 1000 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  return (
    <View style={styles.barContainer}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text }]}>
          <Text style={{ fontWeight: 'bold' }}>{label.charAt(0)}</Text> {label.slice(1)}
        </Text>
        <Text style={[styles.valueText, { color: theme.subtext }]}>
          {value} / {target} {unit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.secondaryCard }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
      </View>
    </View>
  );
};

export const MacroBars: React.FC<MacroBarsProps> = ({ protein, targetProtein, carbs, targetCarbs, fat, targetFat }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <ProgressBar 
        label="Protein" 
        value={protein} 
        target={targetProtein} 
        color={theme.macroProtein} 
      />
      <ProgressBar 
        label="Carbs" 
        value={carbs} 
        target={targetCarbs} 
        color={theme.macroCarbs} 
      />
      <ProgressBar 
        label="Fat" 
        value={fat} 
        target={targetFat} 
        color={theme.macroFat} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  barContainer: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.sans,
    letterSpacing: 0.3,
  },
  valueText: {
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
