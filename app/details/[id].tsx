import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getEntry, updateEntry } from '@/services/db';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SEGMENT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

export default function DetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { id } = useLocalSearchParams();
  
  const [entry, setEntry] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
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
          if (data.images) {
             setImages(JSON.parse(data.images));
          } else {
             setImages([]);
          }
        } catch (e) {
          setImages([]);
        }

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
                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={handleSave} 
                 style={[styles.actionButton, { backgroundColor: theme.success }]}
                >
                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>Save</Text>
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

            {/* Images - New Section */}
            {images.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {images.map((uri, index) => (
                             <TouchableOpacity key={index} onPress={() => setSelectedImage(uri)}>
                                <ExpoImage 
                                   source={{ uri }} 
                                   style={{ width: 120, height: 120, borderRadius: 16, marginRight: 12 }} 
                                   contentFit="cover"
                                />
                             </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Quirky Message Card */}
            {parsedData?.quirky_message && (
              <View style={[styles.quirkyCard, { backgroundColor: theme.secondaryCard, borderColor: theme.peach }]}>
                <Text style={styles.quirkyEmoji}>💡</Text>
                <Text style={[styles.quirkyText, { color: theme.text }]}>
                  {parsedData.quirky_message}
                </Text>
              </View>
            )}

            {/* Total Calories Hero */}
            <View style={[styles.heroCard, { backgroundColor: theme.card }]}>
               <Text style={[styles.heroValue, { color: theme.text }]}>{entry.total_calories}</Text>
               <Text style={[styles.heroLabel, { color: theme.subtext }]}>Total Calories</Text>
            </View>

            {/* Macro Summary Row */}
            <View style={styles.macroSummaryRow}>
               <View style={styles.macroSummaryItem}>
                  <Text style={[styles.macroSummaryValue, { color: theme.macroProtein }]}>{Math.round(parsedData?.total_macros?.protein || 0)}g</Text>
                  <Text style={[styles.macroSummaryLabel, { color: theme.subtext }]}>Protein</Text>
               </View>
               <View style={styles.verticalDivider} />
               <View style={styles.macroSummaryItem}>
                  <Text style={[styles.macroSummaryValue, { color: theme.macroCarbs }]}>{Math.round(parsedData?.total_macros?.carbohydrates || 0)}g</Text>
                  <Text style={[styles.macroSummaryLabel, { color: theme.subtext }]}>Carbs</Text>
               </View>
               <View style={styles.verticalDivider} />
               <View style={styles.macroSummaryItem}>
                  <Text style={[styles.macroSummaryValue, { color: theme.macroFat }]}>{Math.round(parsedData?.total_macros?.fat || 0)}g</Text>
                  <Text style={[styles.macroSummaryLabel, { color: theme.subtext }]}>Fat</Text>
               </View>
            </View>

            {/* Macro Breakdown Section */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 10 }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingredient Breakdown</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>Source of your macros</Text>
              
              <View style={{ gap: 24, marginTop: 10 }}>
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
            </View>

            {/* Original Menu Text */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
                <Text style={[styles.content, { color: theme.subtext }]}>{entry.formatted_menu}</Text>
            </View>

          </View>
        )}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          {selectedImage && (
             <ExpoImage 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage} 
                contentFit="contain"
             />
          )}
        </View>
      </Modal>

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
    gap: 24, // Increased gap for breathing room
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32, // Large Editorial Title
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
    fontFamily: Fonts.serif,
    lineHeight: 38,
  },
  quirkyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    borderWidth: 0,
    gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    elevation: 2,
  },
  quirkyEmoji: {
    fontSize: 28,
  },
  quirkyText: {
    fontSize: 17,
    lineHeight: 26,
    flex: 1,
    fontStyle: 'italic',
    fontFamily: Fonts.serif, // Serif for the quote feeling
  },
  heroCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    marginBottom: 5,
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    elevation: 3,
  },
  heroValue: {
    fontSize: 56,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: Fonts.sans, // Sans for big numbers usually cleaner
    letterSpacing: -1,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: Fonts.sans,
    opacity: 0.6,
  },
  macroSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  macroSummaryItem: {
    alignItems: 'center',
  },
  macroSummaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Fonts.mono, // Mono for data points
  },
  macroSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Fonts.sans,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e5e5', 
    opacity: 0.5,
  },
  section: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Fonts.serif,
  },
  sectionSubtitle: {
    fontSize: 15,
    marginBottom: 20,
    fontFamily: Fonts.sans,
    opacity: 0.7,
  },
  macroRow: {
    marginBottom: 0,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Fonts.mono,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 36, // Taller bars
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
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: Fonts.sans,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: Fonts.serif, // Reading content looks nice in Serif
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: Fonts.sans,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 16,
  },
  actionButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      elevation: 2,
  },
  buttonText: {
      fontWeight: '700',
      fontSize: 16,
      fontFamily: Fonts.sans,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
});
