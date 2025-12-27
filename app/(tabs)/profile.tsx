import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getProfile, saveProfile } from '@/services/db';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('Not specified');
  const [activityLevel, setActivityLevel] = useState('Moderate');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      if (profile) {
        setName(profile.name || '');
        setAge(profile.age?.toString() || '');
        setWeight(profile.weight?.toString() || '');
        setHeight(profile.height?.toString() || '');
        setGender(profile.gender || 'Not specified');
        setActivityLevel(profile.activity_level || 'Moderate');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    if (!name || !age || !weight || !height) {
      Alert.alert('Missing Info', 'Please fill in all basic fields.');
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile(
        name,
        parseInt(age),
        parseFloat(weight),
        parseFloat(height),
        gender,
        activityLevel
      );
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (label: string, value: string, onChangeText: (t: string) => void, placeholder: string, keyboardType: any = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.secondaryCard, color: theme.text, borderColor: theme.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.subtext}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="person-circle-outline" size={80} color={theme.tint} />
            <Text style={[styles.title, { color: theme.text }]}>Your Profile</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              This helps the AI give you better estimates.
            </Text>
          </View>

          {renderInput('Name', name, setName, 'Enter your name')}
          {renderInput('Age', age, setAge, 'e.g. 25', 'numeric')}
          {renderInput('Weight (kg)', weight, setWeight, 'e.g. 70', 'numeric')}
          {renderInput('Height (cm)', height, setHeight, 'e.g. 175', 'numeric')}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
            <View style={styles.pickerRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.pickerItem,
                    { backgroundColor: theme.secondaryCard, borderColor: theme.border },
                    gender === g && { backgroundColor: theme.tint, borderColor: theme.tint }
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.pickerText, { color: theme.text }, gender === g && { color: '#fff' }]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.tint }, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerItem: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pickerText: {
    fontWeight: '500',
  },
  saveButton: {
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
