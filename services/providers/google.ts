import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import { Profile } from '../db';
import { GoalInput, GoalResult, ProcessResult } from './types';

const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

export async function process(
  apiKey: string,
  model: string,
  items: string[],
  profile: Profile | null,
  imageUris: string[] = []
): Promise<ProcessResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({ model });

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

  const prompt = `
  You are a professional nutrition and calorie estimation assistant.
  I will give you a list of food items I ate.
  ${imageUris.length > 0 ? 'I have also attached images of the meal. Use them to estimate portion sizes and identify ingredients more accurately.' : ''}
  ${userContext}

  Please respond with a JSON object containing:
  1. "title": A quirky, fun, short title for this meal.
  2. "items": An array of objects, each having:
     - "name" (string)
     - "calories" (integer number)
     - "macros": An object with "carbohydrates" (grams, number), "protein" (grams, number), and "fat" (grams, number).
  3. "total_calories": The sum of all calories.
  4. "total_macros": An object with "carbohydrates", "protein", and "fat" representing the sum of all items.
  5. "quirky_message": A fun, quirky, short message about this meal oriented towards weight loss. Be encouraging but slightly funny.

  The input items are: ${items.join(', ')}

  Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
  `;

  const parts: any[] = [{ text: prompt }];
  for (const uri of imageUris) {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    parts.push({ inlineData: { data: base64, mimeType: 'image/jpeg' } });
  }

  const result = await m.generateContent(parts);
  const response = await result.response;
  const data = JSON.parse(cleanJson(response.text()));

  const formatted_menu = data.items
    .map(
      (item: any) =>
        `${item.name}: ${item.calories} cal (C: ${item.macros.carbohydrates}g, P: ${item.macros.protein}g, F: ${item.macros.fat}g)`
    )
    .join('\n');

  return {
    title: data.title ?? 'Meal',
    formatted_menu: formatted_menu ?? '',
    raw_json: JSON.stringify(data),
    total_calories: Number(data.total_calories) || 0,
    total_macros: JSON.stringify(data.total_macros || { carbohydrates: 0, protein: 0, fat: 0 }),
  };
}

export async function curate(
  apiKey: string,
  model: string,
  profile: Profile,
  input: GoalInput
): Promise<GoalResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({ model });

  const prompt = `
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

  Respond ONLY with a JSON object matching:
  {
    "target_calories": integer,
    "target_protein": integer (grams/day),
    "target_carbs": integer (grams/day),
    "target_fat": integer (grams/day),
    "rationale": "short plain-English explanation",
    "safety_note": "empty string if the plan is safe; otherwise explain the concern",
    "weekly_rate_kg": number (negative = loss, positive = gain)
  }

  Do not include markdown fences.
  `;

  const result = await m.generateContent([{ text: prompt }]);
  const response = await result.response;
  const data = JSON.parse(cleanJson(response.text()));
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
