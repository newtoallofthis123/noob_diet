import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSetting, setSetting } from '@/services/db';
import { deleteApiKey, getApiKey, setApiKey } from '@/services/keys';
import { PROVIDER_MODELS, ProviderId } from '@/services/providers';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROVIDERS: ProviderId[] = ['google', 'xai'];
const PROVIDER_LABELS: Record<ProviderId, string> = {
  google: 'Google',
  xai: 'xAI',
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [provider, setProvider] = useState<ProviderId>('google');
  const [model, setModel] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [savedFlags, setSavedFlags] = useState<Record<ProviderId, boolean>>({
    google: false,
    xai: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    loadModelFor(provider);
    setKeyInput('');
  }, [provider]);

  const hydrate = async () => {
    const active = await getSetting('activeProvider');
    const initial: ProviderId = active === 'xai' ? 'xai' : 'google';
    setProvider(initial);
    await loadModelFor(initial);
    const [g, x] = await Promise.all([getApiKey('google'), getApiKey('xai')]);
    setSavedFlags({ google: !!g, xai: !!x });
  };

  const loadModelFor = async (p: ProviderId) => {
    const stored = await getSetting(`activeModel.${p}`);
    const list = PROVIDER_MODELS[p];
    const next = stored && list.includes(stored) ? stored : list[0];
    setModel(next);
  };

  const onSelectProvider = async (p: ProviderId) => {
    setProvider(p);
    await setSetting('activeProvider', p);
  };

  const onSelectModel = async (m: string) => {
    setModel(m);
    await setSetting(`activeModel.${provider}`, m);
  };

  const onSaveKey = async () => {
    const trimmed = keyInput.trim();
    setIsSaving(true);
    try {
      if (trimmed.length === 0) {
        await deleteApiKey(provider);
        setSavedFlags((s) => ({ ...s, [provider]: false }));
        Alert.alert('Removed', `${PROVIDER_LABELS[provider]} API key removed.`);
      } else {
        await setApiKey(provider, trimmed);
        setSavedFlags((s) => ({ ...s, [provider]: true }));
        Alert.alert('Saved', `${PROVIDER_LABELS[provider]} API key saved.`);
      }
      setKeyInput('');
    } catch (e) {
      console.error('save key failed', e);
      Alert.alert('Error', 'Failed to save API key.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Platform.OS === 'web' && (
          <View style={[styles.notice, { backgroundColor: theme.secondaryCard, borderColor: theme.border }]}>
            <Text style={[styles.noticeText, { color: theme.subtext }]}>
              Secure key storage is unavailable on web; keys entered here will not persist securely.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.tint }]}>Provider</Text>
          <View style={styles.pickerRow}>
            {PROVIDERS.map((p) => {
              const active = provider === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => onSelectProvider(p)}
                  style={[
                    styles.pickerItem,
                    { backgroundColor: theme.secondaryCard, borderColor: theme.border },
                    active && { backgroundColor: theme.tint, borderColor: theme.tint },
                  ]}
                >
                  <Text style={[styles.pickerText, { color: theme.text }, active && { color: theme.buttonText }]}>
                    {PROVIDER_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.tint }]}>Model</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {PROVIDER_MODELS[provider].map((m) => {
              const active = model === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => onSelectModel(m)}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.secondaryCard, borderColor: theme.border },
                    active && { backgroundColor: theme.tint, borderColor: theme.tint },
                  ]}
                >
                  <Text style={[styles.chipText, { color: theme.text }, active && { color: theme.buttonText }]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.tint }]}>
            {PROVIDER_LABELS[provider]} API Key
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.secondaryCard, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder={savedFlags[provider] ? 'Key saved — enter to replace' : 'Paste API key'}
              placeholderTextColor={theme.subtext}
              secureTextEntry={!keyVisible}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setKeyVisible((v) => !v)} style={styles.eyeButton}>
              <Ionicons
                name={keyVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.subtext}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.tint }, isSaving && styles.disabled]}
            onPress={onSaveKey}
            disabled={isSaving}
          >
            <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>
              {isSaving ? 'Saving…' : keyInput.trim().length === 0 && savedFlags[provider] ? 'Remove Key' : 'Save Key'}
            </Text>
          </TouchableOpacity>

          <View style={styles.statusRow}>
            {PROVIDERS.map((p) => (
              <View
                key={p}
                style={[
                  styles.statusChip,
                  { backgroundColor: theme.secondaryCard, borderColor: theme.border },
                ]}
              >
                <Ionicons
                  name={savedFlags[p] ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={savedFlags[p] ? theme.success : theme.subtext}
                />
                <Text style={[styles.statusText, { color: theme.text }]}>
                  {PROVIDER_LABELS[p]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  notice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { fontSize: 13 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerItem: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pickerText: { fontWeight: '500' },
  chipsRow: { gap: 10, paddingRight: 10 },
  chip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 16, height: '100%' },
  eyeButton: { padding: 6 },
  saveButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontSize: 13, fontWeight: '500' },
});
