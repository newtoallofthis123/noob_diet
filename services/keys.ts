import * as SecureStore from 'expo-secure-store';

export type ProviderId = 'google' | 'xai';

const keyFor = (provider: ProviderId) => `apiKey.${provider}`;

export const getApiKey = async (provider: ProviderId): Promise<string | null> => {
  return await SecureStore.getItemAsync(keyFor(provider));
};

export const setApiKey = async (provider: ProviderId, value: string): Promise<void> => {
  await SecureStore.setItemAsync(keyFor(provider), value);
};

export const deleteApiKey = async (provider: ProviderId): Promise<void> => {
  await SecureStore.deleteItemAsync(keyFor(provider));
};
