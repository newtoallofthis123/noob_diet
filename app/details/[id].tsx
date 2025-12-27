import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getEntry, updateEntry } from '@/services/db';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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
      loadEntry(Number(id));
      alert('Updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Entry not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ 
          title: isEditing ? 'Edit Entry' : entry.title,
          headerTintColor: theme.tint,
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text }
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isEditing ? (
          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.secondaryCard, color: theme.text, borderColor: theme.border }]}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={theme.subtext}
            />

            <Text style={[styles.label, { color: theme.text }]}>Menu Content</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.secondaryCard, color: theme.text, borderColor: theme.border }]}
              value={formattedMenu}
              onChangeText={setFormattedMenu}
              multiline
              placeholderTextColor={theme.subtext}
            />
            
            <View style={styles.buttonRow}>
               <TouchableOpacity 
                 onPress={() => setIsEditing(false)} 
                 style={[styles.actionButton, { backgroundColor: theme.danger }]}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={handleSave} 
                 style={[styles.actionButton, { backgroundColor: theme.success }]}
                >
                    <Text style={styles.buttonText}>Save</Text>
               </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.headerRow}>
               <Text style={[styles.title, { color: theme.text }]}>{entry.title}</Text>
               <TouchableOpacity 
                 onPress={() => setIsEditing(true)} 
                 style={[styles.editButton, { backgroundColor: theme.primary }]}
                >
                    <Text style={styles.buttonText}>Edit</Text>
               </TouchableOpacity>
            </View>
            
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Formatted Menu</Text>
                <Text style={[styles.content, { color: theme.text }]}>{entry.formatted_menu}</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Raw JSON</Text>
                <Text style={[styles.code, { backgroundColor: theme.secondaryCard, color: theme.subtext }]}>{entry.raw_json}</Text>
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
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    padding: 10,
    fontSize: 12,
    borderRadius: 8,
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
    gap: 12,
  },
  actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
  },
  editButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
  },
  buttonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
  }
});
