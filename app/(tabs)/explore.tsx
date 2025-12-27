import { getEntries } from '@/services/db';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Entry = {
  id: number;
  title: string;
  formatted_menu: string;
  raw_json: string;
};

export default function HistoryScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const router = useRouter();

  useFocusEffect(
      useCallback(() => {
        const fetchEntries = async () => {
          try {
            const data = await getEntries();
            // @ts-ignore
            setEntries(data);
          } catch (error) {
            console.error("Failed to fetch entries", error);
          }
        };
        fetchEntries();
        return () => {};
      }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>History</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => router.push(`/details/${item.id}`)}
          >
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.itemSnippet}>
                {item.formatted_menu}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <Text style={styles.emptyText}>No entries found.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSnippet: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  }
});
