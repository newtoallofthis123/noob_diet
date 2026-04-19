import CurateGoalModal from '@/components/CurateGoalModal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Entry, getEntries, getProfile, listGoals, Profile, saveProfile, setActiveGoal, WeightGoal } from '@/services/db';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
  const router = useRouter();

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
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<WeightGoal[]>([]);
  const [curateOpen, setCurateOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const reloadGoals = useCallback(() => {
    listGoals().then(setGoals).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      getEntries().then(setEntries).catch(() => {});
      reloadGoals();
    }, [reloadGoals])
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();

  const todayEntries = entries.filter((e) => e.date === todayIso);
  const todayKcal = todayEntries.reduce((s, e) => s + (e.total_calories || 0), 0);
  const todayMacros = todayEntries.reduce(
    (acc, e) => {
      try {
        const m = JSON.parse(e.total_macros || '{}');
        acc.protein += Number(m.protein) || 0;
        acc.carbohydrates += Number(m.carbohydrates) || 0;
        acc.fat += Number(m.fat) || 0;
      } catch {}
      return acc;
    },
    { protein: 0, carbohydrates: 0, fat: 0 }
  );
  const sevenDayKcal = entries
    .filter((e) => e.date >= sevenDaysAgoIso)
    .reduce((s, e) => s + (e.total_calories || 0), 0);
  const sevenDayAvg = Math.round(sevenDayKcal / 7);

  const tc = parseInt(targetCalories) || 0;
  const tp = parseInt(targetProtein) || 0;
  const tcarbs = parseInt(targetCarbs) || 0;
  const tf = parseInt(targetFat) || 0;

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

  const profileComplete = !!(
    parseInt(age) > 0 &&
    parseFloat(weight) > 0 &&
    parseFloat(height) > 0 &&
    gender && gender !== 'Not specified' &&
    activityLevel
  );

  const buildProfile = (): Profile => ({
    name,
    age: parseInt(age) || 0,
    weight: parseFloat(weight) || 0,
    height: parseFloat(height) || 0,
    gender,
    activity_level: activityLevel,
    target_calories: parseInt(targetCalories) || 0,
    target_protein: parseInt(targetProtein) || 0,
    target_carbs: parseInt(targetCarbs) || 0,
    target_fat: parseInt(targetFat) || 0,
  });

  const applyGoal = async (g: WeightGoal) => {
    try {
      await setActiveGoal(g.id);
      await saveProfile(
        name,
        parseInt(age) || 0,
        parseFloat(weight) || 0,
        parseFloat(height) || 0,
        gender,
        activityLevel,
        g.target_calories,
        g.target_protein,
        g.target_carbs,
        g.target_fat
      );
      setTargetCalories(String(g.target_calories));
      setTargetProtein(String(g.target_protein));
      setTargetCarbs(String(g.target_carbs));
      setTargetFat(String(g.target_fat));
      reloadGoals();
    } catch (e) {
      Alert.alert('Error', 'Failed to apply goal.');
    }
  };

  const handleGoalTap = (g: WeightGoal) => {
    Alert.alert(
      'Apply this goal?',
      `Overwrite your targets with goal from ${new Date(g.created_at).toLocaleDateString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => applyGoal(g) },
      ]
    );
  };

  const handleCurateApplied = async () => {
    await loadProfile();
    reloadGoals();
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
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.settingsButton}
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-outline" size={24} color={theme.tint} />
            </TouchableOpacity>
            <View style={[styles.avatarContainer, { borderColor: theme.tint }]}>
                <Ionicons name="person" size={50} color={theme.tint} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>My Profile</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Set your goals and personal details
            </Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: theme.secondaryCard, borderColor: theme.border }]}>
            <Text style={[styles.statsLabel, { color: theme.subtext }]}>Today</Text>
            <Text style={[styles.statsKcal, { color: theme.text }]}>
              {todayKcal}{tc > 0 ? ` / ${tc}` : ''} kcal
            </Text>
            <View style={styles.macroRow}>
              <View style={styles.macroTile}>
                <Text style={[styles.macroLabel, { color: theme.subtext }]}>P</Text>
                <Text style={[styles.macroValue, { color: theme.text }]}>
                  {Math.round(todayMacros.protein)}{tp > 0 ? `/${tp}` : ''}g
                </Text>
              </View>
              <View style={styles.macroTile}>
                <Text style={[styles.macroLabel, { color: theme.subtext }]}>C</Text>
                <Text style={[styles.macroValue, { color: theme.text }]}>
                  {Math.round(todayMacros.carbohydrates)}{tcarbs > 0 ? `/${tcarbs}` : ''}g
                </Text>
              </View>
              <View style={styles.macroTile}>
                <Text style={[styles.macroLabel, { color: theme.subtext }]}>F</Text>
                <Text style={[styles.macroValue, { color: theme.text }]}>
                  {Math.round(todayMacros.fat)}{tf > 0 ? `/${tf}` : ''}g
                </Text>
              </View>
            </View>
            <Text style={[styles.statsAvg, { color: theme.subtext }]}>
              7-day avg: {sevenDayAvg} kcal/day
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
            <TouchableOpacity
              style={[
                styles.curateButton,
                { borderColor: theme.tint },
                !profileComplete && styles.disabledButton,
              ]}
              onPress={() => setCurateOpen(true)}
              disabled={!profileComplete}
            >
              <Ionicons name="sparkles-outline" size={18} color={theme.tint} />
              <Text style={[styles.curateButtonText, { color: theme.tint }]}>Curate with AI</Text>
            </TouchableOpacity>
            {!profileComplete && (
              <Text style={[styles.hint, { color: theme.subtext }]}>
                Fill Personal Details first to enable AI curation.
              </Text>
            )}
          </View>

          {goals.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.tint }]}>Goal History</Text>
              {goals.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalRow, { backgroundColor: theme.secondaryCard, borderColor: theme.border }]}
                  onPress={() => handleGoalTap(g)}
                >
                  <View style={styles.goalRowHeader}>
                    <Text style={[styles.goalTitle, { color: theme.text }]}>
                      {g.target_weight}kg · {g.timeline_weeks}w
                    </Text>
                    <View style={styles.goalRight}>
                      {g.active === 1 && (
                        <View style={[styles.activeBadge, { backgroundColor: theme.tint }]}>
                          <Text style={[styles.activeBadgeText, { color: theme.buttonText }]}>Active</Text>
                        </View>
                      )}
                      <Text style={[styles.goalDate, { color: theme.subtext }]}>
                        {new Date(g.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  {!!g.rationale && (
                    <Text style={[styles.goalRationale, { color: theme.subtext }]} numberOfLines={2}>
                      {g.rationale.length > 80 ? g.rationale.slice(0, 80) + '…' : g.rationale}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

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
      <CurateGoalModal
        visible={curateOpen}
        profile={buildProfile()}
        onClose={() => setCurateOpen(false)}
        onApplied={handleCurateApplied}
      />
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
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 1,
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
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statsKcal: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  macroTile: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsAvg: {
    fontSize: 13,
  },
  curateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  curateButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  goalRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  goalRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  goalDate: {
    fontSize: 12,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalRationale: {
    fontSize: 13,
    lineHeight: 18,
  },
});
