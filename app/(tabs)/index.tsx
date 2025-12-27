import { saveEntry } from '@/services/db';
import { processInput } from '@/services/processor';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
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
    // Focus the input?? (React Native doesn't easily support auto-focus programmatically without ref, but user will likely tap input)
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
      const { title, formatted_menu, raw_json } = await processInput(items);
      await saveEntry(title, formatted_menu, raw_json);
      setItems([]);
      alert('Saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => handleEdit(index)} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(index)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Adjusted as it's inside SafeAreaView
      >
        <View style={styles.header}>
            <Text style={styles.title}>New Entry</Text>
            {items.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
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
                    style={[styles.submitButton, isProcessing && styles.disabledButton]} 
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
                    <Text style={styles.emptyText}>Add items to your list below.</Text>
                </View>
            )
          }
        />

        <View style={styles.inputWrapper}>
          {editingIndex !== null && (
               <View style={styles.editingBanner}>
                   <Text style={styles.editingText}>Editing item #{editingIndex + 1}</Text>
                   <TouchableOpacity onPress={handleCancelEdit}>
                       <Ionicons name="close-circle" size={20} color="#666" />
                   </TouchableOpacity>
               </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={editingIndex !== null ? "Update item..." : "Type here..."}
              multiline
              autoCorrect={false} 
            />
            <TouchableOpacity onPress={handleSend} style={[styles.sendButton, editingIndex !== null && styles.updateButton]}>
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
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearText: {
    color: '#FF3B30',
    fontSize: 16,
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
    color: '#999',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
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
    backgroundColor: '#34C759',
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
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10, // Adjust if needed
  },
  editingBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingHorizontal: 4,
  },
  editingText: {
      color: '#007AFF',
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
    backgroundColor: '#f0f2f5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 12, 
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButton: {
      backgroundColor: '#5856D6',
  }
});
