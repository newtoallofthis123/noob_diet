import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Entry } from '@/services/db';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FoodListProps {
  items: Entry[];
  onDelete: (id: number) => void;
}

export const FoodList: React.FC<FoodListProps> = ({ items, onDelete }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  if (items.length === 0) {
      return (
          <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>No meals tracked today yet.</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const macros = item.total_macros ? JSON.parse(item.total_macros) : { protein: 0, carbohydrates: 0, fat: 0 };
        const date = new Date(item.date || Date.now());
        const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        return (
          <View key={item.id} style={[styles.itemWrapper, { backgroundColor: theme.secondaryCard, borderColor: theme.border }]}>
            <TouchableOpacity 
                style={styles.mainContent} 
                onPress={() => router.push(`/details/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.leftCol}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.macros, { color: theme.subtext }]}>
                        P: {macros.protein}g, C: {macros.carbohydrates}g, F: {macros.fat}g
                    </Text>
                     <Text style={[styles.time, { color: theme.subtext }]}>{timeStr}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.rightCol}>
                <Text style={[styles.calories, { color: theme.tint }]}>{item.total_calories}</Text>
                <Text style={[styles.calLabel, { color: theme.subtext }]}>kcal</Text>
                <TouchableOpacity 
                    style={[styles.deleteBtn, { backgroundColor: theme.background }]} 
                    onPress={() => onDelete(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 16, // Increased gap
  },
  emptyContainer: {
      padding: 40,
      alignItems: 'center',
  },
  emptyText: {
      fontSize: 14,
      fontFamily: Fonts.sans,
      textAlign: 'center',
      marginTop: 20,
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 0,
    marginBottom: 0, // Handled by gap
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    elevation: 2,
  },
  mainContent: {
      flex: 1,
      paddingRight: 10,
  },
  leftCol: {
      gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Fonts.serif, // Serif for item titles
  },
  macros: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: Fonts.mono, // Mono for numbers/data often looks cool
      opacity: 0.8,
  },
  time: {
      fontSize: 11,
      marginTop: 2,
      opacity: 0.5,
      fontFamily: Fonts.sans,
  },
  rightCol: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minWidth: 50,
  },
  calories: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
  calLabel: {
      fontSize: 10,
      marginTop: -4,
      marginBottom: 4,
      fontFamily: Fonts.sans,
      opacity: 0.5,
  },
  deleteBtn: {
      padding: 8,
      borderRadius: 12,
      marginTop: 4,
  }
});
