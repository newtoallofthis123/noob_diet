import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getEntry, updateEntry } from '@/services/db';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SEGMENT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

export default function DetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { id } = useLocalSearchParams();
  
  const [entry, setEntry] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
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
        
        try {
          // Parse the raw JSON to get structured data for visualization
          const parsed = JSON.parse(data.raw_json);
          setParsedData(parsed);
        } catch (e) {
          console.error("Failed to parse raw_json", e);
        }
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

  const MacroBar = ({ label, macroKey, total }: { label: string, macroKey: 'protein' | 'carbohydrates' | 'fat', total: number }) => {
    if (!parsedData?.items || total === 0) return null;

    return (
      <View style={styles.macroRow}>
        <View style={styles.macroHeader}>
          <Text style={[styles.macroLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.macroValue, { color: theme.subtext }]}>{Math.round(total)}g</Text>
        </View>
        <View style={styles.progressBarContainer}>
          {parsedData.items.map((item: any, index: number) => {
            const itemAmount = item.macros?.[macroKey] || 0;
            const percentage = (itemAmount / total) * 100;
            if (percentage <= 0) return null;

            return (
              <View 
                key={index}
                style={[
                  styles.segment, 
                  { 
                    flex: percentage, 
                    backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] 
                  }
                ]}
              >
                {percentage > 10 && (
                   <Text style={styles.segmentText} numberOfLines={1}>
                     {item.name}
                   </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
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
          title: isEditing ? 'Edit Entry' : 'Meal Details',
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
          <View style={styles.viewContent}>
            
            {/* Header / Title */}
            <View style={styles.headerRow}>
               <Text style={[styles.title, { color: theme.text }]}>{entry.title}</Text>
               <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={{ color: theme.tint, fontWeight: '600' }}>Edit</Text>
               </TouchableOpacity>
            </View>

            {/* Quirky Message Card */}
            {parsedData?.quirky_message && (
              <View style={[styles.quirkyCard, { backgroundColor: theme.secondaryCard, borderColor: theme.peach }]}>
                <Text style={styles.quirkyEmoji}>💡</Text>
                <Text style={[styles.quirkyText, { color: theme.text }]}>
                  {parsedData.quirky_message}
                </Text>
              </View>
            )}

            {/* Summary Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Text style={[styles.statValue, { color: theme.text }]}>{entry.total_calories}</Text>
                 <Text style={[styles.statLabel, { color: theme.subtext }]}>Calories</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Text style={[styles.statValue, { color: theme.macroProtein }]}>{Math.round(parsedData?.total_macros?.protein || 0)}g</Text>
                 <Text style={[styles.statLabel, { color: theme.subtext }]}>Protein</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Text style={[styles.statValue, { color: theme.macroCarbs }]}>{Math.round(parsedData?.total_macros?.carbohydrates || 0)}g</Text>
                 <Text style={[styles.statLabel, { color: theme.subtext }]}>Carbs</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Text style={[styles.statValue, { color: theme.macroFat }]}>{Math.round(parsedData?.total_macros?.fat || 0)}g</Text>
                 <Text style={[styles.statLabel, { color: theme.subtext }]}>Fat</Text>
              </View>
            </View>

            {/* Macro Distribution Bars */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Macro Breakdown</Text>
              
              <MacroBar 
                label="Protein" 
                macroKey="protein" 
                total={parsedData?.total_macros?.protein || 0} 
              />
              <MacroBar 
                label="Carbs" 
                macroKey="carbohydrates" 
                total={parsedData?.total_macros?.carbohydrates || 0} 
              />
              <MacroBar 
                label="Fat" 
                macroKey="fat" 
                total={parsedData?.total_macros?.fat || 0} 
              />
            </View>

            {/* Original Menu Text */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
                <Text style={[styles.content, { color: theme.subtext }]}>{entry.formatted_menu}</Text>
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
    paddingBottom: 40,
  },
  viewContent: {
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  quirkyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  quirkyEmoji: {
    fontSize: 24,
  },
  quirkyText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '40%',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  macroRow: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  segment: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  segmentText: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
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
  buttonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
  }
});
