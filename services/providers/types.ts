export type ProviderId = 'google' | 'xai';

export interface ProcessResult {
  title: string;
  formatted_menu: string;
  raw_json: string;
  total_calories: number;
  total_macros: string;
}

export interface GoalInput {
  target_weight: number;
  timeline_weeks: number;
  notes?: string;
}

export interface GoalResult {
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  rationale: string;
  safety_note: string;
  weekly_rate_kg: number;
}

export class MissingKeyError extends Error {
  provider: ProviderId;
  constructor(provider: ProviderId) {
    super(`No API key saved for provider "${provider}". Open Settings to add one.`);
    this.provider = provider;
    this.name = 'MissingKeyError';
  }
}
