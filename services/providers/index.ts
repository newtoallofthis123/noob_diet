import { getSetting } from '../db';
import type { Profile } from '../db';
import { getApiKey } from '../keys';
import * as google from './google';
import * as xai from './xai';
import { GoalInput, GoalResult, MissingKeyError, ProcessResult, ProviderId } from './types';

export const PROVIDER_MODELS: Record<ProviderId, string[]> = {
  google: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'],
  xai: [
    'grok-4-fast',
    'grok-4.20-0309-reasoning',
    'grok-4.20-0309-non-reasoning',
    'grok-4-1-fast-reasoning',
    'grok-4-1-fast-non-reasoning',
    'grok-2-vision-1212',
  ],
};

const DEFAULT_PROVIDER: ProviderId = 'google';

export const getActiveProvider = async (): Promise<ProviderId> => {
  const v = await getSetting('activeProvider');
  if (v === 'google' || v === 'xai') return v;
  return DEFAULT_PROVIDER;
};

export const getActiveModel = async (provider: ProviderId): Promise<string> => {
  const v = await getSetting(`activeModel.${provider}`);
  if (v && PROVIDER_MODELS[provider].includes(v)) return v;
  return PROVIDER_MODELS[provider][0];
};

const pickImpl = (p: ProviderId) => (p === 'google' ? google : xai);

export const processInput = async (
  items: string[],
  profile: Profile | null,
  imageUris: string[] = []
): Promise<ProcessResult> => {
  const provider = await getActiveProvider();
  const model = await getActiveModel(provider);
  const key = await getApiKey(provider);
  if (!key) throw new MissingKeyError(provider);
  return pickImpl(provider).process(key, model, items, profile, imageUris);
};

export const curateGoal = async (profile: Profile, input: GoalInput): Promise<GoalResult> => {
  const provider = await getActiveProvider();
  const model = await getActiveModel(provider);
  const key = await getApiKey(provider);
  if (!key) throw new MissingKeyError(provider);
  return pickImpl(provider).curate(key, model, profile, input);
};

export { MissingKeyError };
export type { GoalInput, GoalResult, ProcessResult, ProviderId };
