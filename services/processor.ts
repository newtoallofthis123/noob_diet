import { GoogleGenerativeAI } from "@google/generative-ai";
import { Profile } from "./db";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const processInput = async (items: string[], profile: Profile | null) => {
  if (!API_KEY) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not defined in .env");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); 

  let userContext = "";
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
  ${userContext}
  
  Please respond with a JSON object containing:
  1. "title": A quirky, fun, short title for this meal.
  2. "items": An array of objects, each having:
     - "name" (string)
     - "calories" (integer number)
     - "macros": An object with "carbohydrates" (grams, number), "protein" (grams, number), and "fat" (grams, number).
  3. "total_calories": The sum of all calories.
  4. "total_macros": An object with "carbohydrates", "protein", and "fat" representing the sum of all items.

  The input items are: ${items.join(', ')}

  Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(cleanText);

    const formatted_menu = data.items.map((item: any) => 
      `${item.name}: ${item.calories} cal (C: ${item.macros.carbohydrates}g, P: ${item.macros.protein}g, F: ${item.macros.fat}g)`
    ).join('\n');
    
    const raw_json = JSON.stringify(data);

    return {
      title: data.title,
      formatted_menu,
      raw_json,
      total_calories: data.total_calories || 0,
      total_macros: JSON.stringify(data.total_macros || { carbohydrates: 0, protein: 0, fat: 0 })
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};


