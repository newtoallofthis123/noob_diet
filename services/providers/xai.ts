import * as FileSystem from 'expo-file-system/legacy';
import { Profile } from '../db';
import { GoalInput, GoalResult, ProcessResult } from './types';

const ENDPOINT = 'https://api.x.ai/v1/chat/completions';

async function callXai(apiKey: string, model: string, parts: any[]): Promise<string> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: parts }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });
  } catch (e: any) {
    throw new Error(`Network error calling xAI: ${e?.message ?? e}`);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error?.message ?? JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => '');
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`xAI auth failed (${res.status}): ${detail}`);
    }
    if (res.status === 413) {
      throw new Error('Image too large. Max 20 MiB per image.');
    }
    if (res.status === 429) {
      throw new Error('Rate limited. Try again in a moment.');
    }
    throw new Error(`xAI ${res.status}: ${detail}`);
  }

  const body = await res.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('xAI returned empty content');
  }
  return content;
}

function parseJsonLoose(s: string): any {
  const cleaned = s.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

async function buildImageParts(imageUris: string[]): Promise<any[]> {
  const out: any[] = [];
  for (const uri of imageUris) {
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    out.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'high' },
    });
  }
  return out;
}

export async function process(
  apiKey: string,
  model: string,
  items: string[],
  profile: Profile | null,
  imageUris: string[] = []
): Promise<ProcessResult> {
  let userContext = '';
  if (profile) {
    userContext = `
    The user's profile:
    - Name: ${profile.name}
    - Age: ${profile.age}
    - Weight: ${profile.weight} kg
    - Height: ${profile.height} cm
    - Gender: ${profile.gender}
    - Activity Level: ${profile.activity_level}
    Use this information to provide more accurate estimates and a personalized title.
    `;
  }

  const promptText = `
  You are a professional nutrition and calorie estimation assistant.
  I will give you a list of food items I ate.
  ${imageUris.length > 0 ? 'I have also attached images of the meal. Use them to estimate portion sizes and identify ingredients more accurately.' : ''}
  ${userContext}

  Respond ONLY with a JSON object:
  {
    "title": "quirky short title",
    "items": [{"name": string, "calories": integer, "macros": {"carbohydrates": number, "protein": number, "fat": number}}],
    "total_calories": integer,
    "total_macros": {"carbohydrates": number, "protein": number, "fat": number},
    "quirky_message": "short fun weight-loss-oriented message"
  }

  The input items are: ${items.join(', ')}
  `;

  const parts: any[] = [{ type: 'text', text: promptText }, ...(await buildImageParts(imageUris))];
  const content = await callXai(apiKey, model, parts);
  const data = parseJsonLoose(content);

  const formatted_menu = (data.items ?? [])
    .map(
      (item: any) =>
        `${item.name}: ${item.calories} cal (C: ${item.macros.carbohydrates}g, P: ${item.macros.protein}g, F: ${item.macros.fat}g)`
    )
    .join('\n');

  return {
    title: data.title ?? 'Meal',
    formatted_menu,
    raw_json: JSON.stringify(data),
    total_calories: data.total_calories || 0,
    total_macros: JSON.stringify(data.total_macros || { carbohydrates: 0, protein: 0, fat: 0 }),
  };
}

export async function curate(
  apiKey: string,
  model: string,
  profile: Profile,
  input: GoalInput
): Promise<GoalResult> {
  const promptText = `
  You are a sports nutritionist. Compute a daily calorie and macro target for a weight goal.

  Profile:
  - Age: ${profile.age}
  - Gender: ${profile.gender}
  - Height: ${profile.height} cm
  - Current weight: ${profile.weight} kg
  - Activity level: ${profile.activity_level}

  Goal:
  - Target weight: ${input.target_weight} kg
  - Timeline: ${input.timeline_weeks} weeks
  - Notes: ${input.notes ?? '(none)'}

  Respond ONLY with a JSON object:
  {
    "target_calories": integer,
    "target_protein": integer,
    "target_carbs": integer,
    "target_fat": integer,
    "rationale": "short plain-English explanation",
    "safety_note": "empty string if safe; otherwise explain the concern",
    "weekly_rate_kg": number (negative = loss, positive = gain)
  }
  `;

  const content = await callXai(apiKey, model, [{ type: 'text', text: promptText }]);
  const data = parseJsonLoose(content);
  return {
    target_calories: Number(data.target_calories) || 0,
    target_protein: Number(data.target_protein) || 0,
    target_carbs: Number(data.target_carbs) || 0,
    target_fat: Number(data.target_fat) || 0,
    rationale: data.rationale ?? '',
    safety_note: data.safety_note ?? '',
    weekly_rate_kg: Number(data.weekly_rate_kg) || 0,
  };
}
