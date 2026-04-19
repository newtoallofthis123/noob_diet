import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { insertGoal, Profile, saveProfile, setActiveGoal } from '@/services/db';
import { curateGoal, GoalResult, MissingKeyError } from '@/services/providers';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Phase = 'input' | 'loading' | 'preview' | 'error';

interface Props {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
  onApplied: () => void;
}

export default function CurateGoalModal({ visible, profile, onClose, onApplied }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('input');
  const [targetWeight, setTargetWeight] = useState('');
  const [timelineWeeks, setTimelineWeeks] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<GoalResult | null>(null);
  const [goalId, setGoalId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMissingKey, setIsMissingKey] = useState(false);

  const resetAndClose = () => {
    setPhase('input');
    setTargetWeight('');
    setTimelineWeeks('');
    setNotes('');
    setResult(null);
    setGoalId(null);
    setErrorMsg('');
    setIsMissingKey(false);
    onClose();
  };

  const runGenerate = async () => {
    const tw = parseFloat(targetWeight);
    const wk = parseInt(timelineWeeks);
    if (!tw || !wk) {
      setErrorMsg('Enter a valid target weight and timeline.');
      setIsMissingKey(false);
      setPhase('error');
      return;
    }
    setPhase('loading');
    setErrorMsg('');
    setIsMissingKey(false);
    try {
      const r = await curateGoal(profile, {
        target_weight: tw,
        timeline_weeks: wk,
        notes: notes || undefined,
      });
      const weeklyRate = (profile.weight - tw) / wk;
      const id = await insertGoal({
        created_at: new Date().toISOString(),
        start_weight: profile.weight,
        target_weight: tw,
        timeline_weeks: wk,
        notes: notes || null,
        target_calories: r.target_calories,
        target_protein: r.target_protein,
        target_carbs: r.target_carbs,
        target_fat: r.target_fat,
        rationale: r.rationale || null,
        safety_note: r.safety_note || null,
        weekly_rate_kg: r.weekly_rate_kg || weeklyRate,
      });
      setResult(r);
      setGoalId(id);
      setPhase('preview');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate goal.');
      setIsMissingKey(err instanceof MissingKeyError);
      setPhase('error');
    }
  };

  const handleApply = async () => {
    if (!result || !goalId) return;
    try {
      await setActiveGoal(goalId);
      await saveProfile(
        profile.name || '',
        profile.age || 0,
        profile.weight || 0,
        profile.height || 0,
        profile.gender || 'Not specified',
        profile.activity_level || 'Moderate',
        result.target_calories,
        result.target_protein,
        result.target_carbs,
        result.target_fat
      );
      onApplied();
      resetAndClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to apply goal.');
      setPhase('error');
    }
  };

  const tw = parseFloat(targetWeight);
  const wk = parseInt(timelineWeeks);
  const clientRate = tw && wk ? (profile.weight - tw) / wk : 0;
  const rateUnsafe = clientRate > 1 || clientRate < -0.5;
  const showSafety = !!result && (!!result.safety_note || rateUnsafe);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Curate with AI</Text>
            <TouchableOpacity onPress={resetAndClose}>
              <Text style={[styles.close, { color: theme.tint }]}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: theme.text }]}>Target weight (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.secondaryCard, borderColor: theme.border, color: theme.text }]}
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="e.g. 70"
              placeholderTextColor={theme.subtext}
              keyboardType="numeric"
              editable={phase !== 'loading'}
            />

            <Text style={[styles.label, { color: theme.text }]}>Timeline (weeks)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.secondaryCard, borderColor: theme.border, color: theme.text }]}
              value={timelineWeeks}
              onChangeText={setTimelineWeeks}
              placeholder="e.g. 12"
              placeholderTextColor={theme.subtext}
              keyboardType="numeric"
              editable={phase !== 'loading'}
            />

            <Text style={[styles.label, { color: theme.text }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline, { backgroundColor: theme.secondaryCard, borderColor: theme.border, color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Dietary preferences, allergies, etc."
              placeholderTextColor={theme.subtext}
              multiline
              editable={phase !== 'loading'}
            />

            {phase === 'loading' && (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.tint} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>Generating goal…</Text>
              </View>
            )}

            {phase === 'error' && (
              <View style={[styles.errorBox, { borderColor: theme.border, backgroundColor: theme.secondaryCard }]}>
                <Text style={[styles.errorText, { color: theme.text }]}>{errorMsg}</Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: theme.tint }]}
                    onPress={runGenerate}
                  >
                    <Text style={[styles.secondaryBtnText, { color: theme.tint }]}>Try again</Text>
                  </TouchableOpacity>
                  {isMissingKey && (
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
                      onPress={() => {
                        onClose();
                        router.push('/settings');
                      }}
                    >
                      <Text style={[styles.primaryBtnText, { color: theme.buttonText }]}>Open Settings</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {phase === 'preview' && result && (
              <View style={[styles.previewBox, { borderColor: theme.border, backgroundColor: theme.secondaryCard }]}>
                <Text style={[styles.previewTitle, { color: theme.text }]}>Suggested targets</Text>
                <View style={styles.macroGrid}>
                  <View style={styles.macroCell}><Text style={[styles.macroK, { color: theme.subtext }]}>kcal</Text><Text style={[styles.macroV, { color: theme.text }]}>{result.target_calories}</Text></View>
                  <View style={styles.macroCell}><Text style={[styles.macroK, { color: theme.subtext }]}>Protein</Text><Text style={[styles.macroV, { color: theme.text }]}>{result.target_protein}g</Text></View>
                  <View style={styles.macroCell}><Text style={[styles.macroK, { color: theme.subtext }]}>Carbs</Text><Text style={[styles.macroV, { color: theme.text }]}>{result.target_carbs}g</Text></View>
                  <View style={styles.macroCell}><Text style={[styles.macroK, { color: theme.subtext }]}>Fat</Text><Text style={[styles.macroV, { color: theme.text }]}>{result.target_fat}g</Text></View>
                </View>
                {!!result.rationale && (
                  <Text style={[styles.rationale, { color: theme.subtext }]}>{result.rationale}</Text>
                )}
                {showSafety && (
                  <View style={styles.safetyBanner}>
                    <Text style={styles.safetyText}>
                      {result.safety_note ||
                        `Heads up: weekly rate ≈ ${clientRate.toFixed(2)} kg/week exceeds safe range.`}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {phase === 'preview' ? (
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: theme.tint, flex: 1 }]}
                  onPress={runGenerate}
                >
                  <Text style={[styles.secondaryBtnText, { color: theme.tint }]}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.tint, flex: 1 }]}
                  onPress={handleApply}
                >
                  <Text style={[styles.primaryBtnText, { color: theme.buttonText }]}>Apply</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.tint }, phase === 'loading' && { opacity: 0.6 }]}
                onPress={runGenerate}
                disabled={phase === 'loading'}
              >
                <Text style={[styles.primaryBtnText, { color: theme.buttonText }]}>
                  {phase === 'loading' ? 'Generating…' : 'Generate'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700' },
  close: { fontSize: 16, fontWeight: '600' },
  scroll: { padding: 24, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  loading: { alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 8, fontSize: 14 },
  errorBox: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 12 },
  errorText: { fontSize: 14, marginBottom: 12 },
  errorActions: { flexDirection: 'row', gap: 12 },
  previewBox: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 12 },
  previewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  macroCell: { width: '50%', paddingVertical: 6 },
  macroK: { fontSize: 12, fontWeight: '600' },
  macroV: { fontSize: 18, fontWeight: '700' },
  rationale: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  safetyBanner: {
    backgroundColor: '#fff4d6',
    borderWidth: 1,
    borderColor: '#d9a400',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  safetyText: { color: '#7a5a00', fontSize: 13, fontWeight: '500' },
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  footerRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },
});
