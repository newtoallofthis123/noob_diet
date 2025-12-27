import { getEntry, updateEntry } from '@/app/services/db';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [title, setTitle] = useState('');
  const [formattedMenu, setFormattedMenu] = useState('');

  useEffect(() => {
    if (id) {
       loadEntry(Number(id));
    }
  }, [id]);

  const loadEntry = async (entryId: number) => {
    setLoading(true);
    try {
      const data = await getEntry(entryId);
      if (data) {
        setEntry(data);
        setTitle(data.title);
        setFormattedMenu(data.formatted_menu);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateEntry(Number(id), title, formattedMenu);
      setIsEditing(false);
      // Reload to ensure we have fresh data, though state is already updated
      loadEntry(Number(id));
      alert('Updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.container}>
        <Text>Entry not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: isEditing ? 'Edit Entry' : entry.title }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isEditing ? (
          <View style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Menu Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formattedMenu}
              onChangeText={setFormattedMenu}
              multiline
            />
            
            <View style={styles.buttonRow}>
               <Button title="Cancel" onPress={() => setIsEditing(false)} color="red" />
               <Button title="Save" onPress={handleSave} />
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.headerRow}>
               <Text style={styles.title}>{entry.title}</Text>
               <Button title="Edit" onPress={() => setIsEditing(true)} />
            </View>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Formatted Menu</Text>
                <Text style={styles.content}>{entry.formatted_menu}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Raw JSON</Text>
                <Text style={styles.code}>{entry.raw_json}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center'
  },
  scrollContent: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  code: {
    fontFamily: 'Courier',
    backgroundColor: '#f4f4f4',
    padding: 10,
    fontSize: 12,
  },
  form: {
    gap: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  }
});
