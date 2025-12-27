import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const processInput = async (items: string[]) => {
  if (!API_KEY) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not defined in .env");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
  You are a calorie estimation assistant. 
  I will give you a list of food items I ate. 
  Please respond with a JSON object containing:
  1. "title": A quirky, fun, short title for this meal.
  2. "items": An array of objects, each having "name" (string) and "calories" (integer number).
  3. "total_calories": The sum of all calories.

  The input items are: ${items.join(', ')}

  Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown code blocks if the model adds them despite instructions
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(cleanText);

    const formatted_menu = data.items.map((item: any) => `${item.name}: ${item.calories} cal`).join('\n');
    const raw_json = JSON.stringify(data);

    return {
      title: data.title,
      formatted_menu,
      raw_json,
      total_calories: data.total_calories || 0
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

