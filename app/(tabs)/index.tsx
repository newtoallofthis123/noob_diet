import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveEntry } from '@/services/db';
import { processInput } from '@/services/processor';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when adding new items (not while editing)
    if (editingIndex === null && items.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [items, editingIndex]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (editingIndex !== null) {
      // Update existing item
      const newItems = [...items];
      newItems[editingIndex] = inputText.trim();
      setItems(newItems);
      setEditingIndex(null);
    } else {
      // Add new item
      setItems([...items, inputText.trim()]);
    }
    setInputText('');
  };

  const handleEdit = (index: number) => {
    setInputText(items[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (editingIndex === index) {
      setEditingIndex(null);
      setInputText('');
    } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex(editingIndex - 1);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
        "Clear All",
        "Are you sure you want to remove all items?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Clear", 
                style: "destructive", 
                onPress: () => {
                    setItems([]);
                    setEditingIndex(null);
                    setInputText('');
                }
            }
        ]
    );
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setInputText('');
    Keyboard.dismiss();
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      const { title, formatted_menu, raw_json, total_calories } = await processInput(items);
      // Ensure date is in ISO format
      const dateStr = selectedDate.toISOString();
      await saveEntry(title, formatted_menu, raw_json, total_calories, dateStr);
      setItems([]);
      alert('Saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save.');
    } finally {
      setIsProcessing(false);
    }
  };

  const showAndroidPicker = () => {
      DateTimePickerAndroid.open({
          value: selectedDate,
          onChange: (event, date) => {
              if (event.type === 'set' && date) {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setSelectedDate(newDate);

                  DateTimePickerAndroid.open({
                      value: newDate,
                      mode: 'time',
                      is24Hour: true,
                      onChange: (event, time) => {
                          if (event.type === 'set' && time) {
                              const finalDate = new Date(newDate);
                              finalDate.setHours(time.getHours(), time.getMinutes());
                              setSelectedDate(finalDate);
                          }
                      }
                  });
              }
          },
          mode: 'date',
          is24Hour: true,
      });
  };

  const onChangeDate = (event: any, date?: Date) => {
    if (date) {
        setSelectedDate(date);
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <View style={[styles.itemContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.itemText, { color: theme.text }]}>{item}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => handleEdit(index)} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={theme.tint} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(index)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>New Entry</Text>
            {items.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                    <Text style={[styles.clearText, { color: theme.danger }]}>Clear All</Text>
                </TouchableOpacity>
            )}
        </View>

        <View style={[styles.datePickerContainer, { borderBottomColor: theme.secondaryBorder }]}>
            <Text style={[styles.dateLabel, { color: theme.text }]}>Date:</Text>
            {Platform.OS === 'android' ? (
                 <TouchableOpacity onPress={showAndroidPicker} style={[styles.dateButton, { backgroundColor: theme.secondaryCard }]}>
                    <Text style={{ color: theme.text }}>{selectedDate.toLocaleString()}</Text>
                 </TouchableOpacity>
            ) : (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedDate}
                    mode="datetime"
                    is24Hour={true}
                    onChange={onChangeDate}
                    style={{ marginLeft: 10 }}
                    textColor={theme.text} // For some picker modes
                    themeVariant={colorScheme}
                />
            )}
        </View>

        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          ListFooterComponent={
            items.length > 0 ? (
              <View style={styles.submitContainer}>
                <TouchableOpacity 
                    style={[styles.submitButton, { backgroundColor: theme.success }, isProcessing && styles.disabledButton]} 
                    onPress={handleSubmit}
                    disabled={isProcessing}
                >
                    <Text style={styles.submitButtonText}>
                        {isProcessing ? "Processing..." : "Submit Entry"}
                    </Text>
                </TouchableOpacity>
              </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: theme.subtext }]}>Add items to your list below.</Text>
                </View>
            )
          }
        />

        <View style={[styles.inputWrapper, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          {editingIndex !== null && (
               <View style={styles.editingBanner}>
                   <Text style={[styles.editingText, { color: theme.tint }]}>Editing item #{editingIndex + 1}</Text>
                   <TouchableOpacity onPress={handleCancelEdit}>
                       <Ionicons name="close-circle" size={20} color={theme.icon} />
                   </TouchableOpacity>
               </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.secondaryCard, color: theme.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={editingIndex !== null ? "Update item..." : "Type here..."}
              placeholderTextColor={theme.subtext}
              multiline
              autoCorrect={false} 
            />
            <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: theme.tint }, editingIndex !== null && { backgroundColor: theme.tint }]}>
               <Ionicons name={editingIndex !== null ? "checkmark" : "arrow-up"} size={24} color="#fff" />
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
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearText: {
    fontSize: 16,
  },
  datePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
  },
  dateLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginRight: 8,
  },
  dateButton: {
      padding: 8,
      borderRadius: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
      fontSize: 14,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  itemText: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  submitContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  inputWrapper: {
    borderTopWidth: 1,
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10, 
  },
  editingBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingHorizontal: 4,
  },
  editingText: {
      fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 12, 
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
