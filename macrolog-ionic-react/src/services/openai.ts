import { FoodItem } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS = {
  premium: 'qwen/qwen3.5-flash-02-23',
  free: 'openrouter/auto:free',
};

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const OpenAIService = {
  async analyzeMealPhoto(
    base64Images: string[],
    apiKey: string,
    userGoals: { calories: number; protein: number; carbs: number; fat: number },
    analysisMode: 'premium' | 'free' = 'premium',
    contextNotes?: string
  ): Promise<FoodItem[]> {
    const model = MODELS[analysisMode];

    const contextClause = contextNotes?.trim()
      ? `\n\nAdditional context from the user: "${contextNotes.trim()}"`
      : '';

    const multiPhotoNote = base64Images.length > 1
      ? ` (${base64Images.length} photos showing different components or angles of the same meal)`
      : '';

    const prompt = `Analyze this meal${multiPhotoNote} and return a JSON array of food items.${contextClause}

For each item provide:
- name: descriptive name of the food
- amount: estimated portion size as a number
- unit: unit of measurement (oz, cup, g, piece, etc.)
- calories: estimated calories
- protein: grams of protein
- carbs: grams of carbohydrates
- fat: grams of fat
- healthScore: score from 0-100 based on three factors (see breakdown below)
- healthBreakdown: object with three scores (0-100 each):
  - nutrientDensity: vitamins, minerals, fiber content
  - processingLevel: whole foods (high) vs processed foods (low)
  - goalAlignment: how well it fits user's goals (${userGoals.calories} cal, ${userGoals.protein}g protein, ${userGoals.carbs}g carbs, ${userGoals.fat}g fat)
- healthReason: brief technical explanation of the scores (1 sentence)
- encouragement: personalized, positive feedback highlighting benefits and gently noting areas for improvement if any (1-2 sentences)

Calculate healthScore as: (nutrientDensity * 0.33) + (processingLevel * 0.33) + (goalAlignment * 0.34)

Return ONLY valid JSON array, no markdown or extra text.`;

    const imageContent = base64Images.map(b64 => ({
      type: 'image_url' as const,
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    }));

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://macrolog.app',
        'X-Title': 'MacroLog',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = (errorData as any).error?.message || (errorData as any).message || response.statusText;
      console.error('OpenRouter error:', response.status, JSON.stringify(errorData));
      if (response.status === 401) throw new Error(`Invalid API key — ${msg}`);
      if (response.status === 402) throw new Error(`No credits on your OpenRouter account. Top up at openrouter.ai/credits.`);
      if (response.status === 429) throw new Error(`Rate limit hit — ${msg}. Try again in a moment.`);
      throw new Error(`OpenRouter ${response.status}: ${msg}`);
    }

    const data: ChatResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) throw new Error('No response from AI model');

    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let foodItems: FoodItem[];
    try {
      foodItems = JSON.parse(jsonContent);
    } catch {
      throw new Error(`Failed to parse AI response. Response: ${jsonContent.substring(0, 200)}`);
    }

    if (!Array.isArray(foodItems)) {
      throw new Error(`Expected array of food items, got ${typeof foodItems}`);
    }

    return foodItems.map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      editable: false,
    }));
  },

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
