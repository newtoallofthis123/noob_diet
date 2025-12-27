import { FoodList } from '@/components/FoodList';
import { MacroBars } from '@/components/MacroBars';
import { MacroCircle } from '@/components/MacroCircle';
import { Colors } from '@/constants/theme';
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
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInput, setShowInput] = useState(false); // To toggle input area
  
  // Daily Totals
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);

  // Targets (default)
  const [targets, setTargets] = useState({
      calories: 2200,
      protein: 150,
      carbs: 250,
      fat: 80
  });

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
            setTargets({
                calories: loadedProfile.target_calories || 2200,
                protein: loadedProfile.target_protein || 150,
                carbs: loadedProfile.target_carbs || 250,
                fat: loadedProfile.target_fat || 80
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
          car += macros.carbs || 0;
          fat += macros.fat || 0;
      });
      setTotalCalories(cal);
      setTotalProtein(pro);
      setTotalCarbs(car);
      setTotalFat(fat);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    Keyboard.dismiss();
    try {
      const profile = await getProfile();
      // processInput expects array of strings
      const { title, formatted_menu, raw_json, total_calories, total_macros } = await processInput([inputText], profile);
      
      const dateStr = new Date().toISOString();
      await saveEntry(title, formatted_menu, raw_json, total_calories, total_macros, dateStr);
      
      setInputText('');
      setShowInput(false);
      await loadData();
      // Maybe show a success toast?
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to process entry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
      // In a real app we'd verify delete, but for this demo just direct delete or update state
      // We actually need a delete function in db.ts, which I saw earlier.
      const { deleteEntry } = require('@/services/db'); 
      await deleteEntry(id);
      loadData();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
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

            {/* Food List */}
            <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: theme.text }]}>Consumed</Text>
                <TouchableOpacity onPress={() => setShowInput(true)}>
                    <Ionicons name="add-circle" size={28} color={theme.tint} />
                </TouchableOpacity>
            </View>
            
            <FoodList items={entries} onDelete={handleDelete} />

        </ScrollView>

        {/* Floating Input Area or Bottom Sheet */}
        <View style={[styles.bottomContainer, { backgroundColor: theme.secondaryCard, borderTopColor: theme.secondaryBorder }]}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                    placeholder="Log a food item (e.g. 'Oatmeal with berries')"
                    placeholderTextColor={theme.subtext}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline={false} 
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity 
                    style={[styles.sendButton, { backgroundColor: theme.tint }, isProcessing && { opacity: 0.6 }]}
                    onPress={handleSend}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <Ionicons name="hourglass" size={20} color="#fff" />
                    ) : (
                        <Text style={styles.sendButtonText}>ADD</Text>
                    )}
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
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },
  divider: {
      height: 1,
      width: '90%',
      alignSelf: 'center',
      marginVertical: 24,
      opacity: 0.5,
  },
  listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 0,
  },
  listTitle: {
      fontSize: 20,
      fontWeight: 'bold',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12, // More padding for "Premium" feel
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  input: {
      flex: 1,
      height: 50,
      borderRadius: 25,
      paddingHorizontal: 20,
      fontSize: 16,
  },
  sendButton: {
      height: 50,
      paddingHorizontal: 20,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
  },
  sendButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
  }
});
