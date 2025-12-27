import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Entry } from '@/services/db';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FoodListProps {
  items: Entry[];
  onDelete: (id: number) => void;
}

export const FoodList: React.FC<FoodListProps> = ({ items, onDelete }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  if (items.length === 0) {
      return (
          <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>No meals tracked today yet.</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const macros = item.total_macros ? JSON.parse(item.total_macros) : { protein: 0, carbs: 0, fat: 0 };
        const date = new Date(item.date || Date.now());
        const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        return (
          <View key={item.id} style={[styles.item, { backgroundColor: theme.secondaryCard }]}>
            <View style={[styles.dot, { backgroundColor: theme.secondaryBorder }]} />
            
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.calories, { color: theme.text }]}>{item.total_calories} cal</Text>
                </View>
                
                <View style={styles.detailsRow}>
                     <Text style={[styles.macros, { color: theme.subtext }]}>
                        P {macros.protein}g • C {macros.carbs}g • F {macros.fat}g
                     </Text>
                     <Text style={[styles.time, { color: theme.subtext }]}>{timeStr}</Text>
                </View>
            </View>

            {/* Optional: Add swipe to delete or similar. For now, maybe just a long press or a delete icon? 
                The prompt didn't strictly ask for delete in the list, but it's good UX.
                I'll render a small trash icon for now.
             */}
             <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
                 <Ionicons name="trash-outline" size={16} color={theme.subtext} />
             </TouchableOpacity>
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
    marginTop: 20,
    gap: 12,
  },
  emptyContainer: {
      padding: 40,
      alignItems: 'center',
  },
  emptyText: {
      fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  calories: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macros: {
      fontSize: 12,
  },
  time: {
      fontSize: 12,
      marginRight: 8,
  },
  deleteBtn: {
      padding: 4,
  }
});
