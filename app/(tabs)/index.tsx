import { FoodList } from '@/components/FoodList';
import { MacroBars } from '@/components/MacroBars';
import { MacroCircle } from '@/components/MacroCircle';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Entry, getEntries, getProfile, saveEntry } from '@/services/db';
import { processInput } from '@/services/processor';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  // Data State
  const [entries, setEntries] = useState<Entry[]>([]);
  const [targets, setTargets] = useState({
      calories: 2200, protein: 150, carbs: 250, fat: 80
  });

  // Daily Totals
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);

  // Staging State (New Entry)
  const [stagingItems, setStagingItems] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
        const [loadedProfile, loadedEntries] = await Promise.all([
            getProfile(),
            getEntries()
        ]);

        if (loadedProfile) {
            console.log("Loaded Profile Targets:", loadedProfile);
            setTargets({
                calories: Number(loadedProfile.target_calories) || 2200,
                protein: Number(loadedProfile.target_protein) || 150,
                carbs: Number(loadedProfile.target_carbs) || 250,
                fat: Number(loadedProfile.target_fat) || 80
            });
        }

        // Filter for today
        const today = new Date().toDateString();
        const todaysEntries = loadedEntries.filter(e => {
            const entryDate = new Date(e.date || Date.now());
            return entryDate.toDateString() === today;
        });

        setEntries(todaysEntries);
        calculateTotals(todaysEntries);

    } catch (e) {
        console.error("Failed to load data", e);
    }
  };

  const calculateTotals = (items: Entry[]) => {
      let cal = 0, pro = 0, car = 0, fat = 0;
      items.forEach(item => {
          cal += item.total_calories || 0;
          const macros = item.total_macros ? JSON.parse(item.total_macros) : {};
          pro += macros.protein || 0;
          car += macros.carbohydrates || 0; 
          fat += macros.fat || 0;
      });
      setTotalCalories(cal);
      setTotalProtein(pro);
      setTotalCarbs(car);
      setTotalFat(fat);
  };

  // --- Staging Logic ---

  const handleAddItem = () => {
    if (!inputText.trim()) return;

    if (editingIndex !== null) {
        const newItems = [...stagingItems];
        newItems[editingIndex] = inputText.trim();
        setStagingItems(newItems);
        setEditingIndex(null);
    } else {
        setStagingItems([...stagingItems, inputText.trim()]);
    }
    setInputText('');
  };

  const handleEditItem = (index: number) => {
      setInputText(stagingItems[index]);
      setEditingIndex(index);
  };

  const handleDeleteItem = (index: number) => {
      const newItems = stagingItems.filter((_, i) => i !== index);
      setStagingItems(newItems);
      if (editingIndex === index) {
          setEditingIndex(null);
          setInputText('');
      } else if (editingIndex !== null && editingIndex > index) {
          setEditingIndex(editingIndex - 1);
      }
  };

  const handleClearStaging = () => {
      Alert.alert("Clear All", "Remove all unsaved items?", [
          { text: "Cancel", style: "cancel" },
          { text: "Clear", style: "destructive", onPress: () => {
              setStagingItems([]);
              setEditingIndex(null);
              setInputText('');
          }}
      ]);
  };

  const handleSubmitStaging = async () => {
    if (stagingItems.length === 0) return;
    
    setIsProcessing(true);
    Keyboard.dismiss();
    try {
      const profile = await getProfile();
      // Process all staging items
      const { title, formatted_menu, raw_json, total_calories, total_macros } = await processInput(stagingItems, profile);
      
      const dateStr = new Date().toISOString();
      await saveEntry(title, formatted_menu, raw_json, total_calories, total_macros, dateStr);
      
      setStagingItems([]);
      setInputText('');
      await loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to process entry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
      const { deleteEntry } = require('@/services/db'); 
      await deleteEntry(id);
      loadData();
  };

  // --- Render ---

  // Determine which list to show
  const isStagingMode = stagingItems.length > 0;

  const renderStagingItem = ({ item, index }: { item: string, index: number }) => (
      <View style={[styles.stagingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.stagingText, { color: theme.text }]}>{item}</Text>
          <View style={styles.stagingActions}>
              <TouchableOpacity onPress={() => handleEditItem(index)}>
                  <Ionicons name="pencil" size={20} color={theme.tint} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteItem(index)}>
                  <Ionicons name="trash-outline" size={20} color={theme.danger} />
              </TouchableOpacity>
          </View>
      </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
            contentContainerStyle={[styles.scrollContent]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header / Date */}
            <View style={styles.header}>
                <Text style={[styles.dateText, { color: theme.text }]}>Today</Text>
            </View>

            {/* Macro Circle */}
            <MacroCircle 
                calories={totalCalories} 
                target={targets.calories} 
                protein={totalProtein}
                carbs={totalCarbs}
                fat={totalFat}
            />

            {/* Macro Breakdown Bars */}
            <MacroBars 
                protein={totalProtein} targetProtein={targets.protein}
                carbs={totalCarbs} targetCarbs={targets.carbs}
                fat={totalFat} targetFat={targets.fat}
            />

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Conditional Lists */}
            {isStagingMode ? (
                // Staging View
                <View style={styles.stagingContainer}>
                    <View style={styles.listHeader}>
                        <Text style={[styles.listTitle, { color: theme.text }]}>New Entry</Text>
                        <TouchableOpacity onPress={handleClearStaging}>
                            <Text style={{ color: theme.danger, fontWeight: '600' }}>Clear All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {stagingItems.map((item, index) => (
                         <View key={index} style={{ marginBottom: 8 }}>
                             {renderStagingItem({ item, index })}
                         </View>
                    ))}

                    <TouchableOpacity 
                        style={[styles.submitButton, { backgroundColor: theme.success }, isProcessing && { opacity: 0.6 }]}
                        onPress={handleSubmitStaging}
                        disabled={isProcessing}
                    >
                        <Text style={[styles.submitButtonText, { color: theme.buttonText }]}>
                            {isProcessing ? "Processing..." : `Submit ${stagingItems.length} Item${stagingItems.length > 1 ? 's' : ''}`}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // Consumed View
                <View>
                    <View style={styles.listHeader}>
                        <Text style={[styles.listTitle, { color: theme.text }]}>Consumed</Text>
                    </View>
                    <FoodList items={entries} onDelete={handleDeleteEntry} />
                </View>
            )}

        </ScrollView>

        {/* Input Area */}
        <View style={[styles.bottomContainer, { backgroundColor: theme.secondaryCard, borderTopColor: theme.secondaryBorder }]}>
            {editingIndex !== null && (
                <View style={styles.editingBanner}>
                    <Text style={[styles.editingText, { color: theme.tint }]}>Editing item #{editingIndex + 1}</Text>
                    <TouchableOpacity onPress={() => { setEditingIndex(null); setInputText(''); }}>
                        <Ionicons name="close-circle" size={20} color={theme.icon} />
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                    placeholder={editingIndex !== null ? "Update item..." : "Log food"}
                    placeholderTextColor={theme.subtext}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline={false} 
                    returnKeyType="done"
                    onSubmitEditing={handleAddItem}
                />
                <TouchableOpacity 
                    style={[styles.sendButton, { backgroundColor: theme.tint }]}
                    onPress={handleAddItem}
                >
                    <Ionicons name={editingIndex ? "checkmark" : "arrow-up"} size={20} color={theme.buttonText} />
                </TouchableOpacity>
            </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100, // Extra padding for bottom input
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 32,
    fontFamily: Fonts.serif,
    fontWeight: 'bold',
    color: Colors.light.text, // Default, will be overridden inline
  },
  divider: {
      height: 1,
      width: '90%',
      alignSelf: 'center',
      marginVertical: 24,
      opacity: 0.2,
  },
  listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
      marginTop: 8,
  },
  listTitle: {
      fontSize: 22,
      fontFamily: Fonts.serif,
      fontWeight: '600',
  },
  // Staging Styles
  stagingContainer: {
      paddingHorizontal: 16,
      marginBottom: 20,
  },
  stagingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12, // Slightly more squared
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 0, // Remove border for clean card look
  },
  stagingText: {
      fontSize: 16,
      fontFamily: Fonts.sans,
      flex: 1,
  },
  stagingActions: {
      flexDirection: 'row',
      gap: 16,
  },
  submitButton: {
      marginTop: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
  },
  submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Fonts.sans,
      letterSpacing: 0.5,
  },
  // Input Styles
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16, 
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: -4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 0,
  },
  editingBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 4,
  },
  editingText: {
      fontWeight: '600',
      fontSize: 14,
      fontFamily: Fonts.sans,
  },
  inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  input: {
      flex: 1,
      height: 56,
      borderRadius: 12,
      paddingHorizontal: 20,
      fontSize: 16,
      fontFamily: Fonts.sans,
      borderWidth: 1,
      borderColor: 'transparent', // Can toggle this
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
  },
  sendButton: {
      height: 56,
      width: 56,
      borderRadius: 16, // Squircle
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
  },
});
