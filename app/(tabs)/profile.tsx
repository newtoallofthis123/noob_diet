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
  
  // Macro Targets
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetFat, setTargetFat] = useState('');

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
        
        setTargetCalories(profile.target_calories?.toString() || '2000');
        setTargetProtein(profile.target_protein?.toString() || '150');
        setTargetCarbs(profile.target_carbs?.toString() || '200');
        setTargetFat(profile.target_fat?.toString() || '65');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    if (!name || !targetCalories) {
      Alert.alert('Missing Info', 'Please fill in at least Name and Calorie Target.');
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile(
        name,
        parseInt(age) || 0,
        parseFloat(weight) || 0,
        parseFloat(height) || 0,
        gender,
        activityLevel,
        parseInt(targetCalories),
        parseInt(targetProtein) || 0,
        parseInt(targetCarbs) || 0,
        parseInt(targetFat) || 0
      );
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (label: string, value: string, onChangeText: (t: string) => void, placeholder: string, keyboardType: any = 'default', suffix?: string) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: theme.secondaryCard, borderColor: theme.border }]}>
        <TextInput
            style={[styles.input, { color: theme.text }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.subtext}
            keyboardType={keyboardType}
        />
        {suffix && <Text style={[styles.suffix, { color: theme.subtext }]}>{suffix}</Text>}
      </View>
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
            <View style={[styles.avatarContainer, { borderColor: theme.tint }]}>
                <Ionicons name="person" size={50} color={theme.tint} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>My Profile</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Set your goals and personal details
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.tint }]}>Daily Targets</Text>
            <View style={styles.row}>
                <View style={styles.halfWidth}>
                    {renderInput('Calories', targetCalories, setTargetCalories, '2000', 'numeric', 'kcal')}
                </View>
                <View style={styles.halfWidth}>
                    {renderInput('Protein', targetProtein, setTargetProtein, '150', 'numeric', 'g')}
                </View>
            </View>
            <View style={styles.row}>
                <View style={styles.halfWidth}>
                    {renderInput('Carbs', targetCarbs, setTargetCarbs, '200', 'numeric', 'g')}
                </View>
                <View style={styles.halfWidth}>
                    {renderInput('Fat', targetFat, setTargetFat, '65', 'numeric', 'g')}
                </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: theme.tint }]}>Personal Details</Text>
             {renderInput('Name', name, setName, 'Enter your name')}
             
             <View style={styles.row}>
                <View style={styles.halfWidth}>
                    {renderInput('Age', age, setAge, '25', 'numeric')}
                </View>
                <View style={styles.halfWidth}>
                    {renderInput('Weight', weight, setWeight, '70', 'numeric', 'kg')}
                </View>
             </View>
             
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
                    <Text style={[styles.pickerText, { color: theme.text }, gender === g && { color: theme.buttonText }]}>
                        {g}
                    </Text>
                    </TouchableOpacity>
                ))}
                </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.tint }, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>
              {isSaving ? 'Saving...' : 'Save Changes'}
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
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfWidth: {
      flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  suffix: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
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
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
      height: 1,
      width: '100%',
      marginVertical: 24,
      opacity: 0.2,
  }
});
