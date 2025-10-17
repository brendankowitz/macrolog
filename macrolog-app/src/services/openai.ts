import { FoodItem } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const OpenAIService = {
  /**
   * Analyze a meal photo using OpenAI Vision API
   * @param base64Image - Base64 encoded image
   * @param apiKey - OpenAI API key
   * @param userGoals - User's daily nutrition goals for context
   * @returns Array of identified food items with nutrition and health data
   */
  async analyzeMealPhoto(
    base64Image: string,
    apiKey: string,
    userGoals: { calories: number; protein: number; carbs: number; fat: number }
  ): Promise<FoodItem[]> {
    try {
      const prompt = `Analyze this meal photo and return a JSON array of food items. For each item, provide:
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
- encouragement: personalized, positive feedback highlighting benefits and gently noting areas for improvement if any (Oura Ring style, 1-2 sentences)

Calculate healthScore as: (nutrientDensity * 0.33) + (processingLevel * 0.33) + (goalAlignment * 0.34)

Return ONLY valid JSON array, no markdown or extra text.

Examples of encouragement messages:
- "Your protein shake is excellent for muscle recovery with 25g protein, though it's highly processed. Consider pairing with whole foods for added nutrients."
- "Grilled chicken is a lean protein powerhouse! Great choice for meeting your goals."
- "This pizza provides energy but is high in processed carbs and sodium. Balance it with vegetables or save room for a nutrient-dense meal later."`;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1500,
          temperature: 0.3, // Lower temperature for more consistent results
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      // Remove markdown code blocks if present
      const jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const foodItems: FoodItem[] = JSON.parse(jsonContent);

      // Add unique IDs to each item
      return foodItems.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
        editable: false,
      }));
    } catch (error) {
      console.error('Error analyzing meal:', error);

      if (error instanceof Error) {
        // Re-throw with more context
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message.includes('500') || error.message.includes('503')) {
          throw new Error('OpenAI service temporarily unavailable. Please try again.');
        }
      }

      throw error;
    }
  },

  /**
   * Validate API key by making a simple test request
   * @param apiKey - OpenAI API key to validate
   * @returns true if valid, throws error if invalid
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  },
};
